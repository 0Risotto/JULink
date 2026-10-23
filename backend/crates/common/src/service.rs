use std::{net::SocketAddr, time::Duration};

use axum::{Router, middleware};
use http::{HeaderName, Method, StatusCode, header};
use tower_http::{
    cors::{AllowOrigin, CorsLayer},
    limit::RequestBodyLimitLayer,
    request_id::{MakeRequestUuid, PropagateRequestIdLayer, SetRequestIdLayer},
    timeout::TimeoutLayer,
    trace::TraceLayer,
};

use crate::{config::BaseConfig, health, metrics::Metrics, shutdown};

/// Wires the standard middleware stack and starts the service.
pub struct ServiceBuilder {
    name: String,
    config: BaseConfig,
    router: Router,
    db: Option<sqlx::PgPool>,
    metrics: Metrics,
}

impl ServiceBuilder {
    pub fn new(name: &str, config: BaseConfig) -> Self {
        Self {
            name: name.to_string(),
            config,
            router: Router::new(),
            db: None,
            metrics: Metrics::new(name),
        }
    }

    pub fn router(mut self, router: Router) -> Self {
        self.router = router;
        self
    }

    pub fn db(mut self, db: Option<sqlx::PgPool>) -> Self {
        self.db = db;
        self
    }

    pub async fn run(self) -> anyhow::Result<()> {
        let Self {
            name,
            config,
            router,
            db,
            metrics,
        } = self;

        let request_id_header = HeaderName::from_static("x-request-id");
        let app = router
            .merge(health::routes(&name, db))
            .merge(crate::metrics::routes(metrics.clone()))
            .layer(middleware::from_fn_with_state(
                metrics,
                crate::metrics::track,
            ))
            .layer(TraceLayer::new_for_http())
            .layer(RequestBodyLimitLayer::new(10 * 1024 * 1024))
            .layer(TimeoutLayer::with_status_code(
                StatusCode::REQUEST_TIMEOUT,
                Duration::from_secs(30),
            ))
            .layer(cors_layer(&config)?)
            .layer(PropagateRequestIdLayer::new(request_id_header.clone()))
            .layer(SetRequestIdLayer::new(request_id_header, MakeRequestUuid));

        let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
        let listener = tokio::net::TcpListener::bind(addr).await?;
        tracing::info!(service = %name, %addr, "service listening");

        axum::serve(listener, app)
            .with_graceful_shutdown(shutdown::signal())
            .await?;

        Ok(())
    }
}

fn cors_layer(config: &BaseConfig) -> anyhow::Result<CorsLayer> {
    let methods = [
        Method::GET,
        Method::POST,
        Method::PUT,
        Method::PATCH,
        Method::DELETE,
        Method::OPTIONS,
    ];
    let headers = [
        header::AUTHORIZATION,
        header::CONTENT_TYPE,
        header::ACCEPT,
        HeaderName::from_static("x-request-id"),
        HeaderName::from_static("x-requested-with"),
    ];

    Ok(CorsLayer::new()
        .allow_origin(AllowOrigin::list(config.cors_origins.clone()))
        .allow_methods(methods)
        .allow_headers(headers)
        .expose_headers([HeaderName::from_static("x-request-id")])
        .allow_credentials(true))
}
