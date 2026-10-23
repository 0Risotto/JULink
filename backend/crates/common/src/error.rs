use axum::{
    Json,
    http::{StatusCode, header},
    response::{IntoResponse, Response},
};
use serde::Serialize;

/// One error type for every service. Handlers return `AppResult<T>` and the
/// response is always RFC 9457 `application/problem+json`.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("{0}")]
    BadRequest(String),

    #[error("authentication required")]
    Unauthorized,

    #[error("you do not have permission to do that")]
    Forbidden,

    #[error("email address is not verified")]
    EmailNotVerified,

    #[error("resource not found")]
    NotFound,

    #[error("{0}")]
    Conflict(String),

    #[error("{0}")]
    TooManyRequests(String),

    #[error("upstream service error: {0}")]
    Upstream(String),

    #[error("service temporarily unavailable: {0}")]
    Unavailable(String),

    #[error("email delivery failed: {0}")]
    Email(String),

    #[error(transparent)]
    Database(#[from] sqlx::Error),

    #[error(transparent)]
    Http(#[from] reqwest::Error),

    #[error(transparent)]
    HttpBuild(#[from] http::Error),

    #[error(transparent)]
    Json(#[from] serde_json::Error),

    #[error(transparent)]
    Internal(#[from] anyhow::Error),
}

pub type AppResult<T> = Result<T, AppError>;

impl AppError {
    pub fn status(&self) -> StatusCode {
        match self {
            Self::BadRequest(_) => StatusCode::BAD_REQUEST,
            Self::Unauthorized => StatusCode::UNAUTHORIZED,
            Self::Forbidden => StatusCode::FORBIDDEN,
            Self::EmailNotVerified => StatusCode::FORBIDDEN,
            Self::NotFound => StatusCode::NOT_FOUND,
            Self::Conflict(_) => StatusCode::CONFLICT,
            Self::TooManyRequests(_) => StatusCode::TOO_MANY_REQUESTS,
            Self::Upstream(_) => StatusCode::BAD_GATEWAY,
            Self::Unavailable(_) => StatusCode::SERVICE_UNAVAILABLE,
            Self::Email(_) => StatusCode::BAD_GATEWAY,
            Self::Database(_)
            | Self::Http(_)
            | Self::HttpBuild(_)
            | Self::Json(_)
            | Self::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn title(&self) -> &'static str {
        match self {
            Self::BadRequest(_) => "Bad Request",
            Self::Unauthorized => "Unauthorized",
            Self::Forbidden => "Forbidden",
            Self::EmailNotVerified => "Forbidden",
            Self::NotFound => "Not Found",
            Self::Conflict(_) => "Conflict",
            Self::TooManyRequests(_) => "Too Many Requests",
            Self::Upstream(_) => "Bad Gateway",
            Self::Unavailable(_) => "Service Unavailable",
            Self::Email(_) => "Bad Gateway",
            Self::Database(_)
            | Self::Http(_)
            | Self::HttpBuild(_)
            | Self::Json(_)
            | Self::Internal(_) => "Internal Server Error",
        }
    }
}

#[derive(Debug, Serialize)]
pub struct ProblemDetails {
    #[serde(rename = "type")]
    pub type_uri: String,
    pub title: String,
    pub status: u16,
    pub detail: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub instance: Option<String>,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = self.status();
        if status.is_server_error() {
            tracing::error!(error = ?self, "request failed");
        } else {
            tracing::debug!(error = %self, "request rejected");
        }

        let body = ProblemDetails {
            type_uri: "about:blank".to_string(),
            title: self.title().to_string(),
            status: status.as_u16(),
            detail: self.to_string(),
            instance: None,
        };

        (
            status,
            [(header::CONTENT_TYPE, "application/problem+json")],
            Json(body),
        )
            .into_response()
    }
}
