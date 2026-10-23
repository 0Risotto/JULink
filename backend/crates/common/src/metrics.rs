use std::sync::{
    Arc,
    atomic::{AtomicU64, Ordering},
};

use axum::{
    Router,
    extract::{Request, State},
    http::header::CONTENT_TYPE,
    middleware::Next,
    response::Response,
    routing::get,
};

/// Minimal Prometheus-compatible counter. The Phase 1 milestone replaces this
/// with `metrics-exporter-prometheus` histograms and per-route labels.
#[derive(Clone)]
pub struct Metrics {
    service: Arc<str>,
    requests: Arc<AtomicU64>,
}

impl Metrics {
    pub fn new(service: &str) -> Self {
        Self {
            service: Arc::from(service),
            requests: Arc::new(AtomicU64::new(0)),
        }
    }

    pub fn inc(&self) {
        self.requests.fetch_add(1, Ordering::Relaxed);
    }

    pub fn render(&self) -> String {
        format!(
            "# HELP julink_http_requests_total Total HTTP requests handled.\n\
             # TYPE julink_http_requests_total counter\n\
             julink_http_requests_total{{service=\"{}\"}} {}\n",
            self.service,
            self.requests.load(Ordering::Relaxed)
        )
    }
}

pub fn routes(metrics: Metrics) -> Router {
    Router::new().route(
        "/metrics",
        get(move || {
            let metrics = metrics.clone();
            async move {
                (
                    [(CONTENT_TYPE, "text/plain; version=0.0.4")],
                    metrics.render(),
                )
            }
        }),
    )
}

pub async fn track(State(metrics): State<Metrics>, request: Request, next: Next) -> Response {
    metrics.inc();
    next.run(request).await
}
