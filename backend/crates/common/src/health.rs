use axum::{Json, Router, extract::State, http::StatusCode, response::IntoResponse, routing::get};
use serde_json::{Value, json};
use sqlx::PgPool;

#[derive(Clone)]
struct HealthState {
    service: String,
    db: Option<PgPool>,
}

/// Liveness and readiness endpoints shared by every service.
pub fn routes(service: &str, db: Option<PgPool>) -> Router {
    let state = HealthState {
        service: service.to_string(),
        db,
    };

    Router::new()
        .route("/health/live", get(live))
        .route("/health/ready", get(ready))
        .with_state(state)
}

async fn live(State(state): State<HealthState>) -> Json<Value> {
    Json(json!({ "status": "ok", "service": state.service }))
}

async fn ready(State(state): State<HealthState>) -> impl IntoResponse {
    let Some(db) = &state.db else {
        return (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "service": state.service,
                "database": "not_configured"
            })),
        );
    };

    match sqlx::query("SELECT 1").execute(db).await {
        Ok(_) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "service": state.service,
                "database": "up"
            })),
        ),
        Err(error) => {
            tracing::warn!(%error, "readiness check failed");
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "degraded",
                    "service": state.service,
                    "database": "down"
                })),
            )
        }
    }
}
