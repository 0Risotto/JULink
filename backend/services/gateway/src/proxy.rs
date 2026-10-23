use axum::{
    body::Body,
    extract::{
        OriginalUri, Request, State,
        ws::{Message as ClientMessage, WebSocket, WebSocketUpgrade},
    },
    http::{HeaderMap, HeaderName, HeaderValue, Response},
};
use bytes::Bytes;
use futures_util::{SinkExt, StreamExt};
use julink_common::{auth::CurrentUser, error::AppError};
use tokio_tungstenite::{
    connect_async,
    tungstenite::{Message as UpstreamMessage, client::IntoClientRequest},
};
use uuid::Uuid;

use crate::state::GatewayState;

const MAX_BODY_BYTES: usize = 10 * 1024 * 1024;

pub async fn http_proxy(
    State(state): State<GatewayState>,
    OriginalUri(uri): OriginalUri,
    request: Request,
) -> Result<Response<Body>, AppError> {
    let route = state.routes.resolve(uri.path()).ok_or(AppError::NotFound)?;

    let path_and_query = uri
        .path_and_query()
        .map(|value| value.as_str())
        .unwrap_or_else(|| uri.path());
    let upstream = format!("{}{}", route.base_url.trim_end_matches('/'), path_and_query);

    let (mut parts, body) = request.into_parts();
    let bytes = axum::body::to_bytes(body, MAX_BODY_BYTES)
        .await
        .map_err(|error| AppError::BadRequest(format!("request body: {error}")))?;

    let user = parts.extensions.get::<CurrentUser>().cloned();
    sanitize_request_headers(&mut parts.headers, user.as_ref());

    let mut outgoing = state
        .client
        .request(parts.method, &upstream)
        .headers(parts.headers);
    if !bytes.is_empty() {
        outgoing = outgoing.body(bytes);
    }

    let response = outgoing
        .send()
        .await
        .map_err(|error| AppError::Upstream(format!("{upstream}: {error}")))?;
    let status = response.status();
    let headers = response.headers().clone();
    let body = response
        .bytes()
        .await
        .map_err(|error| AppError::Upstream(format!("{upstream}: {error}")))?;

    let mut builder = Response::builder().status(status);
    for (name, value) in headers.iter() {
        if !is_hop_by_hop(name) {
            builder = builder.header(name, value);
        }
    }

    builder.body(Body::from(body)).map_err(AppError::from)
}

pub async fn ws_proxy(
    State(state): State<GatewayState>,
    ws: WebSocketUpgrade,
    OriginalUri(uri): OriginalUri,
    headers: HeaderMap,
) -> Result<Response<Body>, AppError> {
    let mut upstream = state.routes.realtime_ws_url.clone();
    if let Some(query) = uri.query() {
        if !upstream.contains('?') {
            upstream.push('?');
        }
        upstream.push_str(query);
    }

    let forwarded = forward_ws_headers(&headers);

    Ok(ws.on_upgrade(move |socket| async move {
        if let Err(error) = pipe_ws(socket, upstream, forwarded).await {
            tracing::warn!(%error, "websocket proxy closed");
        }
    }))
}

async fn pipe_ws(
    client: WebSocket,
    upstream_url: String,
    headers: HeaderMap,
) -> anyhow::Result<()> {
    let mut request = upstream_url.as_str().into_client_request()?;
    for (name, value) in headers.iter() {
        let name =
            tokio_tungstenite::tungstenite::http::HeaderName::from_bytes(name.as_str().as_bytes())?;
        let value =
            tokio_tungstenite::tungstenite::http::HeaderValue::from_bytes(value.as_bytes())?;
        request.headers_mut().insert(name, value);
    }

    let (upstream, _) = connect_async(request).await?;
    let (mut client_tx, mut client_rx) = client.split();
    let (mut upstream_tx, mut upstream_rx) = upstream.split();

    let client_to_upstream = async {
        while let Some(message) = client_rx.next().await {
            let message = message?;
            if let Some(message) = to_upstream(message) {
                upstream_tx.send(message).await?;
            }
        }
        anyhow::Ok(())
    };

    let upstream_to_client = async {
        while let Some(message) = upstream_rx.next().await {
            let message = message?;
            if let Some(message) = from_upstream(message) {
                client_tx.send(message).await?;
            }
        }
        anyhow::Ok(())
    };

    tokio::select! {
        result = client_to_upstream => result,
        result = upstream_to_client => result,
    }
}

fn to_upstream(message: ClientMessage) -> Option<UpstreamMessage> {
    match message {
        ClientMessage::Text(text) => Some(UpstreamMessage::Text(text.to_string())),
        ClientMessage::Binary(bytes) => Some(UpstreamMessage::Binary(bytes.to_vec())),
        ClientMessage::Ping(bytes) => Some(UpstreamMessage::Ping(bytes.to_vec())),
        ClientMessage::Pong(bytes) => Some(UpstreamMessage::Pong(bytes.to_vec())),
        ClientMessage::Close(_) => Some(UpstreamMessage::Close(None)),
    }
}

fn from_upstream(message: UpstreamMessage) -> Option<ClientMessage> {
    match message {
        UpstreamMessage::Text(text) => Some(ClientMessage::Text(text.to_string().into())),
        UpstreamMessage::Binary(bytes) => Some(ClientMessage::Binary(Bytes::from(bytes))),
        UpstreamMessage::Ping(bytes) => Some(ClientMessage::Ping(Bytes::from(bytes))),
        UpstreamMessage::Pong(bytes) => Some(ClientMessage::Pong(Bytes::from(bytes))),
        UpstreamMessage::Close(_) => Some(ClientMessage::Close(None)),
        UpstreamMessage::Frame(_) => None,
    }
}

fn sanitize_request_headers(headers: &mut HeaderMap, user: Option<&CurrentUser>) {
    for name in [
        "host",
        "content-length",
        "connection",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailer",
        "transfer-encoding",
        "upgrade",
        "x-user-id",
        "x-username",
    ] {
        headers.remove(name);
    }

    if let Some(user) = user {
        if let Ok(value) = HeaderValue::from_str(&user.user_id.to_string()) {
            headers.insert(HeaderName::from_static("x-user-id"), value);
        }
        if let Ok(value) = HeaderValue::from_str(&user.username) {
            headers.insert(HeaderName::from_static("x-username"), value);
        }
    }

    if !headers.contains_key("x-request-id") {
        if let Ok(value) = HeaderValue::from_str(&Uuid::now_v7().to_string()) {
            headers.insert(HeaderName::from_static("x-request-id"), value);
        }
    }
}

fn forward_ws_headers(headers: &HeaderMap) -> HeaderMap {
    let mut forwarded = HeaderMap::new();
    for name in [
        "authorization",
        "cookie",
        "origin",
        "user-agent",
        "x-request-id",
    ] {
        if let Some(value) = headers.get(name) {
            forwarded.insert(HeaderName::from_static(name), value.clone());
        }
    }
    forwarded
}

fn is_hop_by_hop(name: &HeaderName) -> bool {
    matches!(
        name.as_str(),
        "connection"
            | "keep-alive"
            | "proxy-authenticate"
            | "proxy-authorization"
            | "te"
            | "trailer"
            | "transfer-encoding"
            | "upgrade"
    )
}
