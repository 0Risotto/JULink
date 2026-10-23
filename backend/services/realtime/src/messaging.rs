use serde_json::{Value, json};
use uuid::Uuid;

use julink_common::AppError;

use crate::tickets::WsUser;

#[derive(Clone)]
pub struct MessagingClient {
    base: String,
    http: reqwest::Client,
}

impl MessagingClient {
    pub fn new(base_url: &str) -> Self {
        Self {
            base: base_url.trim_end_matches('/').to_string(),
            http: julink_common::http::client(),
        }
    }

    pub async fn is_member(&self, conversation_id: Uuid, user_id: Uuid) -> Result<bool, AppError> {
        let url = format!(
            "{}/internal/conversations/{conversation_id}/is-member/{user_id}",
            self.base
        );
        let response = self.http.get(url).send().await?;
        if !response.status().is_success() {
            return Ok(false);
        }
        let body: Value = response.json().await?;
        Ok(body.get("member").and_then(Value::as_bool).unwrap_or(false))
    }

    pub async fn send_message(
        &self,
        conversation_id: Uuid,
        user: &WsUser,
        kind: Option<String>,
        body: Option<String>,
        media_url: Option<String>,
        shared_post_id: Option<Uuid>,
    ) -> Result<Value, AppError> {
        let payload = json!({
            "kind": kind,
            "body": body,
            "media_url": media_url,
            "shared_post_id": shared_post_id,
        });
        self.post_internal(conversation_id, user, "messages", payload)
            .await
    }

    pub async fn mark_read(
        &self,
        conversation_id: Uuid,
        user: &WsUser,
        message_id: Uuid,
    ) -> Result<(), AppError> {
        let response = self
            .http
            .post(format!(
                "{}/internal/conversations/{conversation_id}/read",
                self.base
            ))
            .header("x-user-id", user.user_id.to_string())
            .header("x-username", &user.username)
            .json(&json!({ "message_id": message_id }))
            .send()
            .await?;

        if response.status().is_success() {
            Ok(())
        } else {
            let status = response.status();
            let detail = response.text().await.unwrap_or_default();
            Err(AppError::Upstream(format!(
                "messaging returned {status}: {detail}"
            )))
        }
    }

    async fn post_internal(
        &self,
        conversation_id: Uuid,
        user: &WsUser,
        action: &str,
        payload: Value,
    ) -> Result<Value, AppError> {
        let response = self
            .http
            .post(format!(
                "{}/internal/conversations/{conversation_id}/{action}",
                self.base
            ))
            .header("x-user-id", user.user_id.to_string())
            .header("x-username", &user.username)
            .json(&payload)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let detail = response.text().await.unwrap_or_default();
            return Err(AppError::Upstream(format!(
                "messaging returned {status}: {detail}"
            )));
        }

        Ok(response.json().await.unwrap_or(Value::Null))
    }
}
