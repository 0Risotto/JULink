use std::time::Duration;

use anyhow::{Context, Result};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use chrono::Utc;
use ed25519_dalek::SigningKey;
use jsonwebtoken::{Algorithm, EncodingKey, Header, encode};
use pkcs8::{DecodePrivateKey, EncodePrivateKey, EncodePublicKey, LineEnding};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub username: String,
    pub iss: String,
    pub iat: usize,
    pub exp: usize,
    pub jti: String,
}

pub struct AuthKeys {
    encoding: EncodingKey,
    public_pem: String,
    kid: String,
    jwk_x: String,
    issuer: String,
}

impl AuthKeys {
    /// Load an Ed25519 key from PEM, or generate an ephemeral one for local
    /// development. Production must supply `JWT_PRIVATE_KEY_PEM`.
    pub fn load_or_generate(private_pem: Option<&str>, issuer: &str) -> Result<Self> {
        let (signing, private_pem) = match private_pem {
            Some(pem) => {
                let signing = SigningKey::from_pkcs8_pem(pem)
                    .with_context(|| "could not parse JWT_PRIVATE_KEY_PEM")?;
                (signing, pem.to_string())
            }
            None => {
                let signing = SigningKey::generate(&mut OsRng);
                let pem = signing.to_pkcs8_pem(LineEnding::LF)?.to_string();
                (signing, pem)
            }
        };

        let verifying = signing.verifying_key();
        let public_bytes = verifying.to_bytes();
        let kid = hex::encode(Sha256::digest(public_bytes))[..16].to_string();
        let jwk_x = URL_SAFE_NO_PAD.encode(public_bytes);
        let public_pem = verifying.to_public_key_pem(LineEnding::LF)?;

        let encoding = EncodingKey::from_ed_pem(private_pem.as_bytes())
            .with_context(|| "could not build the Ed25519 signing key")?;

        Ok(Self {
            encoding,
            public_pem,
            kid,
            jwk_x,
            issuer: issuer.to_string(),
        })
    }

    pub fn issue(&self, user_id: Uuid, username: &str, ttl: Duration) -> Result<String> {
        let now = Utc::now();
        let claims = Claims {
            sub: user_id.to_string(),
            username: username.to_string(),
            iss: self.issuer.clone(),
            iat: now.timestamp() as usize,
            exp: (now + chrono::Duration::from_std(ttl)?).timestamp() as usize,
            jti: Uuid::now_v7().to_string(),
        };

        let mut header = Header::new(Algorithm::EdDSA);
        header.kid = Some(self.kid.clone());

        Ok(encode(&header, &claims, &self.encoding)?)
    }

    pub fn kid(&self) -> &str {
        &self.kid
    }

    pub fn public_pem(&self) -> &str {
        &self.public_pem
    }

    pub fn jwks(&self) -> Value {
        json!({
            "keys": [{
                "kty": "OKP",
                "crv": "Ed25519",
                "x": self.jwk_x,
                "kid": self.kid,
                "use": "sig",
                "alg": "EdDSA"
            }]
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use jsonwebtoken::{DecodingKey, Validation, decode, decode_header};

    #[test]
    fn issues_and_verifies_a_token() {
        let keys = AuthKeys::load_or_generate(None, "julink").unwrap();
        let user_id = Uuid::now_v7();
        let token = keys
            .issue(user_id, "demo", Duration::from_secs(60))
            .unwrap();

        let header = decode_header(&token).unwrap();
        assert_eq!(header.kid.as_deref(), Some(keys.kid()));

        let decoding = DecodingKey::from_ed_pem(keys.public_pem().as_bytes()).unwrap();
        let mut validation = Validation::new(Algorithm::EdDSA);
        validation.set_issuer(&["julink"]);

        let claims = decode::<Claims>(&token, &decoding, &validation)
            .unwrap()
            .claims;
        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.username, "demo");
    }

    #[test]
    fn jwks_contains_the_public_key() {
        let keys = AuthKeys::load_or_generate(None, "julink").unwrap();
        let jwks = keys.jwks();
        let key = &jwks["keys"][0];

        assert_eq!(key["kty"], "OKP");
        assert_eq!(key["crv"], "Ed25519");
        assert_eq!(key["kid"], keys.kid());
        assert!(!key["x"].as_str().unwrap().is_empty());
    }
}
