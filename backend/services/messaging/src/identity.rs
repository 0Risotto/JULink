use julink_clients::ServiceClient;
use julink_common::AppError;
use julink_proto::UserSummary;
use serde::{Deserialize, Serialize};
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

    pub async fn user_by_username(&self, username: &str) -> Result<InternalUser, AppError> {
        self.client
            .get_optional::<InternalUser>(&format!(
                "internal/users/by-username/{}",
                username.trim()
            ))
            .await?
            .ok_or(AppError::NotFound)
    }

    pub async fn users_by_usernames(
        &self,
        usernames: &[String],
    ) -> Result<Vec<UserSummary>, AppError> {
        #[derive(Serialize)]
        struct Request<'a> {
            usernames: &'a [String],
        }

        self.client
            .post("internal/users/batch", &Request { usernames })
            .await
    }
}
