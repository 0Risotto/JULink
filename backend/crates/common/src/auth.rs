use axum::{extract::FromRequestParts, http::request::Parts};
use uuid::Uuid;

use crate::error::AppError;

/// The authenticated principal.
///
/// The gateway validates the access token and forwards `x-user-id` /
/// `x-username`. Services never trust client-supplied versions of those
/// headers: the gateway strips them before injecting its own.
#[derive(Clone, Debug)]
pub struct CurrentUser {
    pub user_id: Uuid,
    pub username: String,
}

impl<S> FromRequestParts<S> for CurrentUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        if let Some(user) = parts.extensions.get::<CurrentUser>() {
            return Ok(user.clone());
        }

        let user_id = parts
            .headers
            .get("x-user-id")
            .and_then(|value| value.to_str().ok())
            .and_then(|value| Uuid::parse_str(value).ok())
            .ok_or(AppError::Unauthorized)?;

        let username = parts
            .headers
            .get("x-username")
            .and_then(|value| value.to_str().ok())
            .unwrap_or("unknown")
            .to_string();

        Ok(Self { user_id, username })
    }
}
