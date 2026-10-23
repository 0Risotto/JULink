use julink_clients::ServiceClient;
use julink_common::AppError;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Clone)]
pub struct MessagingClient {
    client: ServiceClient,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ConversationMember {
    pub user_id: Uuid,
    pub username: String,
}

impl MessagingClient {
    pub fn new(base_url: &str) -> anyhow::Result<Self> {
        Ok(Self {
            client: ServiceClient::new(base_url)?,
        })
    }

    pub async fn members(
        &self,
        conversation_id: Uuid,
    ) -> Result<Vec<ConversationMember>, AppError> {
        self.client
            .get(&format!("internal/conversations/{conversation_id}/members"))
            .await
    }
}
