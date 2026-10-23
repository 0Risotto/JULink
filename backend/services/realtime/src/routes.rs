use std::collections::HashSet;

use axum::{
    Json, Router,
    extract::{
        Query, State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    http::StatusCode,
    response::Response,
    routing::{get, post},
};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use tokio::sync::mpsc;
use uuid::Uuid;

use julink_common::{AppError, auth::CurrentUser};

use crate::{state::RealtimeState, tickets::WsUser};

#[derive(Debug, Deserialize)]
struct TicketQuery {
    ticket: String,
}

#[derive(Debug, Serialize)]
struct TicketResponse {
    ticket: String,
    expires_in: u64,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum ClientFrame {
    Ping,
    Subscribe {
        conversation_id: Uuid,
    },
    Unsubscribe {
        conversation_id: Uuid,
    },
    Typing {
        conversation_id: Uuid,
        typing: bool,
    },
    Read {
        conversation_id: Uuid,
        message_id: Uuid,
    },
    SendMessage {
        conversation_id: Uuid,
        kind: Option<String>,
        body: Option<String>,
        media_url: Option<String>,
        shared_post_id: Option<Uuid>,
        client_id: Option<String>,
    },
}

pub fn router(state: RealtimeState) -> Router {
    Router::new()
        .route("/api/v1/ws/ticket", post(issue_ticket))
        .route("/api/v1/realtime/ping", get(ping))
        .route("/ws", get(ws))
        .with_state(state)
}

async fn ping() -> Json<Value> {
    Json(json!({ "service": "realtime", "status": "ok" }))
}

async fn issue_ticket(
    State(state): State<RealtimeState>,
    user: CurrentUser,
) -> (StatusCode, Json<TicketResponse>) {
    let ws_user = WsUser {
        user_id: user.user_id,
        username: user.username,
    };
    let ticket = state.tickets.issue(ws_user, state.config.ticket_ttl).await;

    (
        StatusCode::CREATED,
        Json(TicketResponse {
            ticket,
            expires_in: state.config.ticket_ttl.as_secs(),
        }),
    )
}

async fn ws(
    State(state): State<RealtimeState>,
    ws: WebSocketUpgrade,
    Query(query): Query<TicketQuery>,
) -> Result<Response, AppError> {
    let user = state
        .tickets
        .consume(&query.ticket)
        .await
        .ok_or(AppError::Unauthorized)?;

    Ok(ws.on_upgrade(move |socket| handle_socket(socket, user, state)))
}

async fn handle_socket(socket: WebSocket, user: WsUser, state: RealtimeState) {
    let connection_id = Uuid::now_v7();
    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<String>();

    state
        .hub
        .join(format!("user:{}", user.user_id), connection_id, tx.clone())
        .await;

    let writer = tokio::spawn(async move {
        while let Some(payload) = rx.recv().await {
            if sender.send(Message::Text(payload.into())).await.is_err() {
                break;
            }
        }
    });

    let mut subscriptions: HashSet<String> = HashSet::new();

    while let Some(Ok(message)) = receiver.next().await {
        let Message::Text(text) = message else {
            continue;
        };

        let Ok(frame) = serde_json::from_str::<ClientFrame>(&text.to_string()) else {
            send_error(&tx, "bad_frame", "could not parse frame");
            continue;
        };

        match frame {
            ClientFrame::Ping => {
                send(&tx, json!({ "type": "pong" }));
            }
            ClientFrame::Subscribe { conversation_id } => {
                let room = format!("conversation:{conversation_id}");
                match state
                    .messaging
                    .is_member(conversation_id, user.user_id)
                    .await
                {
                    Ok(true) => {
                        state
                            .hub
                            .join(room.clone(), connection_id, tx.clone())
                            .await;
                        subscriptions.insert(room);
                        send(
                            &tx,
                            json!({
                                "type": "subscribed",
                                "conversation_id": conversation_id,
                            }),
                        );
                    }
                    Ok(false) => send_error(&tx, "forbidden", "not a conversation member"),
                    Err(error) => send_error(&tx, "upstream", &error.to_string()),
                }
            }
            ClientFrame::Unsubscribe { conversation_id } => {
                let room = format!("conversation:{conversation_id}");
                state.hub.leave(&room, connection_id).await;
                subscriptions.remove(&room);
                send(
                    &tx,
                    json!({
                        "type": "unsubscribed",
                        "conversation_id": conversation_id,
                    }),
                );
            }
            ClientFrame::Typing {
                conversation_id,
                typing,
            } => {
                let room = format!("conversation:{conversation_id}");
                if subscriptions.contains(&room) {
                    state
                        .hub
                        .broadcast(
                            &room,
                            json!({
                                "type": "typing",
                                "conversation_id": conversation_id,
                                "username": user.username,
                                "typing": typing,
                            })
                            .to_string(),
                        )
                        .await;
                }
            }
            ClientFrame::Read {
                conversation_id,
                message_id,
            } => {
                match state
                    .messaging
                    .mark_read(conversation_id, &user, message_id)
                    .await
                {
                    Ok(()) => send(
                        &tx,
                        json!({
                            "type": "read_ack",
                            "conversation_id": conversation_id,
                            "message_id": message_id,
                        }),
                    ),
                    Err(error) => send_error(&tx, "upstream", &error.to_string()),
                }
            }
            ClientFrame::SendMessage {
                conversation_id,
                kind,
                body,
                media_url,
                shared_post_id,
                client_id,
            } => {
                match state
                    .messaging
                    .send_message(
                        conversation_id,
                        &user,
                        kind,
                        body,
                        media_url,
                        shared_post_id,
                    )
                    .await
                {
                    Ok(message) => send(
                        &tx,
                        json!({
                            "type": "sent",
                            "conversation_id": conversation_id,
                            "client_id": client_id,
                            "message_id": message.get("id").cloned().unwrap_or(Value::Null),
                        }),
                    ),
                    Err(error) => send_error(&tx, "upstream", &error.to_string()),
                }
            }
        }
    }

    state.hub.leave_all(connection_id).await;
    writer.abort();
}

fn send(sender: &mpsc::UnboundedSender<String>, value: Value) {
    let _ = sender.send(value.to_string());
}

fn send_error(sender: &mpsc::UnboundedSender<String>, code: &str, message: &str) {
    send(
        sender,
        json!({
            "type": "error",
            "code": code,
            "message": message,
        }),
    );
}
