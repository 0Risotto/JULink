use std::time::Duration;

use futures_util::StreamExt;
use serde_json::{Value, json};

use crate::{repo, state::NotificationsState};

pub async fn run(state: NotificationsState, nats_url: String) {
    loop {
        match async_nats::connect(&nats_url).await {
            Ok(client) => {
                let social = client.subscribe("social.>").await;
                let chat = client.subscribe("chat.>").await;
                let calls = client.subscribe("calls.>").await;

                match (social, chat, calls) {
                    (Ok(mut social), Ok(mut chat), Ok(mut calls)) => {
                        tracing::info!(%nats_url, "notifications consumer connected");
                        loop {
                            tokio::select! {
                                Some(message) = social.next() => handle_follow(&state, message.payload).await,
                                Some(message) = chat.next() => handle_chat(&state, message.payload).await,
                                Some(message) = calls.next() => handle_call(&state, message.payload).await,
                                else => break,
                            }
                        }
                    }
                    _ => tracing::warn!("could not subscribe to notification subjects"),
                }
            }
            Err(error) => {
                tracing::warn!(%error, %nats_url, "notifications NATS reconnect pending");
            }
        }

        tokio::time::sleep(Duration::from_secs(5)).await;
    }
}

async fn handle_follow(state: &NotificationsState, payload: bytes::Bytes) {
    let Ok(value) = serde_json::from_slice::<Value>(&payload) else {
        return;
    };

    let Some(actor_id) = value.get("actor_id").and_then(Value::as_str) else {
        return;
    };
    let Some(target_id) = value.get("target_id").and_then(Value::as_str) else {
        return;
    };
    if actor_id == target_id {
        return;
    }

    let actor_username = value
        .get("actor_username")
        .and_then(Value::as_str)
        .unwrap_or("someone");

    if let (Ok(actor_id), Ok(target_id)) = (
        actor_id.parse::<uuid::Uuid>(),
        target_id.parse::<uuid::Uuid>(),
    ) {
        let _ = create(
            state,
            target_id,
            Some(actor_id),
            Some(actor_username),
            "FOLLOWED_YOU",
            &format!("{actor_username} followed you"),
            "USER",
            &actor_id.to_string(),
            Some(value.clone()),
        )
        .await;
    }
}

async fn handle_chat(state: &NotificationsState, payload: bytes::Bytes) {
    let Ok(value) = serde_json::from_slice::<Value>(&payload) else {
        return;
    };
    let Some(conversation_id) = value.get("conversation_id").and_then(Value::as_str) else {
        return;
    };
    let Some(message) = value.get("message") else {
        return;
    };
    let Some(sender_id) = message.get("sender_id").and_then(Value::as_str) else {
        return;
    };
    let sender_username = message
        .get("sender_username")
        .and_then(Value::as_str)
        .unwrap_or("someone");
    let body = message.get("body").and_then(Value::as_str);

    let Ok(conversation_id) = conversation_id.parse::<uuid::Uuid>() else {
        return;
    };
    let Ok(sender_id) = sender_id.parse::<uuid::Uuid>() else {
        return;
    };

    let Ok(members) = state.messaging.members(conversation_id).await else {
        return;
    };

    for member in members {
        if member.user_id == sender_id {
            continue;
        }
        let _ = create(
            state,
            member.user_id,
            Some(sender_id),
            Some(sender_username),
            "NEW_MESSAGE",
            &format!("{sender_username}: {}", repo::preview(body)),
            "CONVERSATION",
            &conversation_id.to_string(),
            Some(value.clone()),
        )
        .await;
    }
}

async fn handle_call(state: &NotificationsState, payload: bytes::Bytes) {
    let Ok(value) = serde_json::from_slice::<Value>(&payload) else {
        return;
    };
    let Some(call) = value.get("call") else {
        return;
    };
    let Some(call_id) = call.get("id").and_then(Value::as_str) else {
        return;
    };
    let Some(created_by) = call.get("created_by").and_then(Value::as_str) else {
        return;
    };
    let Some(participants) = call.get("participants").and_then(Value::as_array) else {
        return;
    };
    let Ok(call_id) = call_id.parse::<uuid::Uuid>() else {
        return;
    };
    let Ok(created_by) = created_by.parse::<uuid::Uuid>() else {
        return;
    };

    for participant in participants {
        let role = participant
            .get("role")
            .and_then(Value::as_str)
            .unwrap_or("");
        let status = participant
            .get("status")
            .and_then(Value::as_str)
            .unwrap_or("");
        if role != "invitee" || status != "invited" {
            continue;
        }
        let Some(user_id) = participant
            .get("user_id")
            .and_then(Value::as_str)
            .and_then(|id| id.parse::<uuid::Uuid>().ok())
        else {
            continue;
        };

        let caller = participants
            .iter()
            .find(|p| p.get("role").and_then(Value::as_str) == Some("caller"))
            .and_then(|p| p.get("username"))
            .and_then(Value::as_str)
            .unwrap_or("someone");

        let _ = create(
            state,
            user_id,
            Some(created_by),
            Some(caller),
            "CALL_INVITED",
            &format!("{caller} is calling you"),
            "CALL",
            &call_id.to_string(),
            Some(value.clone()),
        )
        .await;
    }
}

#[allow(clippy::too_many_arguments)]
async fn create(
    state: &NotificationsState,
    recipient_id: uuid::Uuid,
    actor_id: Option<uuid::Uuid>,
    actor_username: Option<&str>,
    kind: &str,
    message: &str,
    target_type: &str,
    target_id: &str,
    metadata: Option<Value>,
) -> anyhow::Result<()> {
    let notification = repo::insert(
        &state.db,
        recipient_id,
        actor_id,
        actor_username,
        kind,
        message,
        target_type,
        target_id,
        metadata,
    )
    .await?;

    if let Some(nats) = &state.nats {
        let payload = json!({
            "type": "notification.created",
            "recipient_id": recipient_id,
            "notification": notification,
        });
        let _ = nats
            .publish("notifications.created.v1", payload.to_string().into())
            .await;
    }

    Ok(())
}
