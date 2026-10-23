use std::{collections::HashMap, sync::Arc, time::Duration};

use anyhow::{Context, Result};
use axum::{
    extract::{Request, State},
    http::header::{AUTHORIZATION, HeaderValue},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode, decode_header};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use uuid::Uuid;

use julink_common::{auth::CurrentUser, error::AppError};

use crate::config::GatewayConfig;
use crate::state::GatewayState;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub username: String,
    pub iss: String,
    pub iat: usize,
    pub exp: usize,
    pub jti: String,
}

#[derive(Clone)]
pub struct JwtValidator {
    keys: Arc<RwLock<HashMap<String, DecodingKey>>>,
    validation: Arc<Validation>,
    jwks_url: Option<Arc<str>>,
    client: reqwest::Client,
}

impl JwtValidator {
    pub fn from_pem(pem: &str, issuer: &str) -> Result<Self> {
        let decoding = DecodingKey::from_ed_pem(pem.as_bytes())
            .with_context(|| "could not parse the Ed25519 public key")?;
        let validation = validation_for(issuer);

        let mut keys = HashMap::new();
        keys.insert(String::new(), decoding);

        Ok(Self {
            keys: Arc::new(RwLock::new(keys)),
            validation: Arc::new(validation),
            jwks_url: None,
            client: julink_common::http::client(),
        })
    }

    /// Fetch the identity service's JWKS, retrying while it starts up.
    pub async fn bootstrap(config: &GatewayConfig, client: &reqwest::Client) -> Result<Self> {
        if let Some(pem) = &config.jwt_public_key_pem {
            return Self::from_pem(pem, &config.issuer);
        }

        let jwks_url = format!(
            "{}/internal/jwks.json",
            config.identity_url.trim_end_matches('/')
        );

        for attempt in 1..=60 {
            match fetch_keys(&jwks_url, client).await {
                Ok(keys) => {
                    return Ok(Self {
                        keys: Arc::new(RwLock::new(keys)),
                        validation: Arc::new(validation_for(&config.issuer)),
                        jwks_url: Some(Arc::from(jwks_url.as_str())),
                        client: client.clone(),
                    });
                }
                Err(error) => {
                    tracing::warn!(%error, attempt, "identity JWKS not ready yet");
                }
            }
            tokio::time::sleep(Duration::from_secs(1)).await;
        }

        anyhow::bail!("could not fetch the JWKS from identity at {jwks_url}")
    }

    pub async fn validate(&self, token: &str) -> Result<Claims, AppError> {
        let header = decode_header(token).map_err(|_| AppError::Unauthorized)?;
        let kid = header.kid.unwrap_or_default();

        let key = {
            let keys = self.keys.read().await;
            select_key(&keys, &kid)
        };

        let key = match key {
            Some(key) => key,
            None if self.jwks_url.is_some() => {
                self.refresh().await?;
                let keys = self.keys.read().await;
                select_key(&keys, &kid).ok_or(AppError::Unauthorized)?
            }
            None => return Err(AppError::Unauthorized),
        };

        decode::<Claims>(token, &key, &self.validation)
            .map(|data| data.claims)
            .map_err(|error| {
                tracing::debug!(%error, "jwt validation failed");
                AppError::Unauthorized
            })
    }

    async fn refresh(&self) -> Result<(), AppError> {
        let Some(url) = &self.jwks_url else {
            return Ok(());
        };

        let keys = fetch_keys(url, &self.client)
            .await
            .map_err(|error| AppError::Upstream(format!("could not refresh JWKS: {error}")))?;
        *self.keys.write().await = keys;
        Ok(())
    }
}

fn validation_for(issuer: &str) -> Validation {
    let mut validation = Validation::new(Algorithm::EdDSA);
    validation.set_issuer(&[issuer]);
    validation.validate_aud = false;
    validation
}

fn select_key(keys: &HashMap<String, DecodingKey>, kid: &str) -> Option<DecodingKey> {
    keys.get(kid).cloned().or_else(|| {
        // A PEM fallback has no kid; accept it when it is the only key.
        if keys.len() == 1 {
            keys.values().next().cloned()
        } else {
            None
        }
    })
}

#[derive(Debug, Deserialize)]
struct JwkSet {
    keys: Vec<Jwk>,
}

#[derive(Debug, Deserialize)]
struct Jwk {
    kty: String,
    crv: String,
    x: String,
    kid: String,
}

async fn fetch_keys(url: &str, client: &reqwest::Client) -> Result<HashMap<String, DecodingKey>> {
    let response = client
        .get(url)
        .send()
        .await
        .with_context(|| format!("request to {url} failed"))?;

    if !response.status().is_success() {
        anyhow::bail!("{url} returned {}", response.status());
    }

    let set: JwkSet = response
        .json()
        .await
        .with_context(|| "invalid JWKS response")?;

    let mut keys = HashMap::new();
    for jwk in set.keys {
        if jwk.kty == "OKP" && jwk.crv == "Ed25519" {
            let key = DecodingKey::from_ed_components(&jwk.x)
                .with_context(|| format!("invalid Ed25519 JWK `{}`", jwk.kid))?;
            keys.insert(jwk.kid, key);
        }
    }

    if keys.is_empty() {
        anyhow::bail!("JWKS at {url} contained no Ed25519 keys");
    }

    Ok(keys)
}

/// Routes that must work before a user has an access token.
pub fn is_public(path: &str) -> bool {
    path == "/metrics"
        || path == "/ws"
        || path.starts_with("/health/")
        || matches!(
            path,
            "/api/v1/auth/dev-token"
                | "/api/v1/auth/register"
                | "/api/v1/auth/verify-otp"
                | "/api/v1/auth/otp/resend"
                | "/api/v1/auth/login"
                | "/api/v1/auth/refresh"
                | "/api/v1/auth/logout"
                | "/api/v1/auth/password/forgot"
                | "/api/v1/auth/password/reset"
        )
}

pub async fn require_auth(
    State(state): State<GatewayState>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let path = request.uri().path().to_string();

    if is_public(&path) {
        // Never let a client spoof identity headers, even on public routes.
        request.headers_mut().remove("x-user-id");
        request.headers_mut().remove("x-username");
        return Ok(next.run(request).await);
    }

    let token = bearer_token(&request).ok_or(AppError::Unauthorized)?;
    let claims = state.jwt.validate(token).await?;
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;

    let user = CurrentUser {
        user_id,
        username: claims.username.clone(),
    };

    request.extensions_mut().insert(user);
    request.headers_mut().insert(
        "x-user-id",
        HeaderValue::from_str(&user_id.to_string()).map_err(|_| AppError::Unauthorized)?,
    );
    request.headers_mut().insert(
        "x-username",
        HeaderValue::from_str(&claims.username).map_err(|_| AppError::Unauthorized)?,
    );

    Ok(next.run(request).await)
}

fn bearer_token(request: &Request) -> Option<&str> {
    request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .filter(|value| !value.is_empty())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn public_routes_do_not_require_a_token() {
        assert!(is_public("/health/live"));
        assert!(is_public("/health/ready"));
        assert!(is_public("/metrics"));
        assert!(is_public("/ws"));
        assert!(is_public("/api/v1/auth/dev-token"));
        assert!(is_public("/api/v1/auth/register"));
        assert!(is_public("/api/v1/auth/verify-otp"));
        assert!(is_public("/api/v1/auth/login"));
        assert!(is_public("/api/v1/auth/refresh"));
        assert!(is_public("/api/v1/auth/logout"));
        assert!(is_public("/api/v1/auth/password/forgot"));
        assert!(is_public("/api/v1/auth/password/reset"));
    }

    #[test]
    fn protected_routes_require_a_token() {
        assert!(!is_public("/api/v1/auth/me"));
        assert!(!is_public("/api/v1/auth/logout-all"));
        assert!(!is_public("/api/v1/posts/123"));
        assert!(!is_public("/api/v1/chat/conversations"));
    }
}
