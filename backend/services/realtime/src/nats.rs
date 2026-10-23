use std::time::Duration;

use futures_util::StreamExt;
use serde_json::Value;

use crate::state::RealtimeState;

pub async fn run(state: RealtimeState, nats_url: String) {
    loop {
        match async_nats::connect(&nats_url).await {
            Ok(client) => {
                let chat = client.subscribe("chat.>").await;
                let calls = client.subscribe("calls.>").await;
                let notifications = client.subscribe("notifications.>").await;

                match (chat, calls, notifications) {
                    (Ok(mut chat), Ok(mut calls), Ok(mut notifications)) => {
                        tracing::info!(%nats_url, "realtime subscribed to NATS");
                        loop {
                            tokio::select! {
                                Some(message) = chat.next() => consume_chat(&state, message.payload).await,
                                Some(message) = calls.next() => consume_calls(&state, message.payload).await,
                                Some(message) = notifications.next() => consume_notification(&state, message.payload).await,
                                else => break,
                            }
                        }
                    }
                    _ => {
                        tracing::warn!("could not subscribe to NATS subjects");
                    }
                }
            }
            Err(error) => {
                tracing::warn!(%error, %nats_url, "could not connect to NATS; retrying");
            }
        }

        tokio::time::sleep(Duration::from_secs(5)).await;
    }
}

async fn consume_chat(state: &RealtimeState, payload: bytes::Bytes) {
    let text = String::from_utf8_lossy(&payload).to_string();
    let Ok(value) = serde_json::from_str::<Value>(&text) else {
        return;
    };

    if let Some(conversation_id) = value.get("conversation_id").and_then(Value::as_str) {
        state
            .hub
            .broadcast(&format!("conversation:{conversation_id}"), text)
            .await;
    }
}

async fn consume_calls(state: &RealtimeState, payload: bytes::Bytes) {
    let text = String::from_utf8_lossy(&payload).to_string();
    let Ok(value) = serde_json::from_str::<Value>(&text) else {
        return;
    };

    if let Some(participants) = value.get("participant_ids").and_then(Value::as_array) {
        for participant in participants {
            if let Some(user_id) = participant.as_str() {
                state
                    .hub
                    .broadcast(&format!("user:{user_id}"), text.clone())
                    .await;
            }
        }
    }
}

async fn consume_notification(state: &RealtimeState, payload: bytes::Bytes) {
    let text = String::from_utf8_lossy(&payload).to_string();
    let Ok(value) = serde_json::from_str::<Value>(&text) else {
        return;
    };

    if let Some(recipient_id) = value.get("recipient_id").and_then(Value::as_str) {
        state
            .hub
            .broadcast(&format!("user:{recipient_id}"), text)
            .await;
    }
}
