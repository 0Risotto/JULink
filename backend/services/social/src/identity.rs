use julink_clients::ServiceClient;
use julink_common::AppError;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Clone)]
pub struct IdentityClient {
    client: ServiceClient,
}

#[derive(Debug, Clone, Deserialize)]
pub struct InternalUser {
    pub user_id: Uuid,
    pub username: String,
}

impl IdentityClient {
    pub fn new(base_url: &str) -> anyhow::Result<Self> {
        Ok(Self {
            client: ServiceClient::new(base_url)?,
        })
    }

    /// Resolve a username through identity's internal API. Social never reads
    /// the identity database directly.
    pub async fn user_by_username(&self, username: &str) -> Result<InternalUser, AppError> {
        self.client
            .get_optional::<InternalUser>(&format!(
                "internal/users/by-username/{}",
                username.trim()
            ))
            .await?
            .ok_or(AppError::NotFound)
    }
}
