use std::env;

use axum::{
    Router, middleware,
    routing::{any, get},
};

use crate::{auth, proxy, state::GatewayState};

/// The public routing table. Each feature owns a prefix; the gateway only
/// forwards, it never reads another service's database.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ServiceRoute {
    pub prefix: String,
    pub base_url: String,
}

#[derive(Clone, Debug)]
pub struct ServiceRoutes {
    routes: Vec<ServiceRoute>,
    pub realtime_ws_url: String,
}

const ROUTE_TABLE: &[(&str, &str, &str)] = &[
    ("/api/v1/auth", "IDENTITY_URL", "http://localhost:9000"),
    ("/api/v1/users", "IDENTITY_URL", "http://localhost:9000"),
    ("/api/v1/profile", "IDENTITY_URL", "http://localhost:9000"),
    ("/api/v1/follow", "SOCIAL_URL", "http://localhost:9001"),
    ("/api/v1/blocks", "SOCIAL_URL", "http://localhost:9001"),
    ("/api/v1/posts", "CONTENT_URL", "http://localhost:9002"),
    ("/api/v1/comments", "CONTENT_URL", "http://localhost:9002"),
    ("/api/v1/media", "CONTENT_URL", "http://localhost:9002"),
    ("/api/v1/feed", "FEED_URL", "http://localhost:9003"),
    ("/api/v1/trending", "FEED_URL", "http://localhost:9003"),
    ("/api/v1/search", "SEARCH_URL", "http://localhost:9004"),
    ("/api/v1/chat", "MESSAGING_URL", "http://localhost:9005"),
    ("/api/v1/ws", "REALTIME_URL", "http://localhost:9006"),
    ("/api/v1/calls", "CALLS_URL", "http://localhost:9007"),
    (
        "/api/v1/lost-found",
        "COMMUNITY_URL",
        "http://localhost:9008",
    ),
    (
        "/api/v1/lost-and-founds",
        "COMMUNITY_URL",
        "http://localhost:9008",
    ),
    ("/api/v1/reports", "COMMUNITY_URL", "http://localhost:9008"),
    (
        "/api/v1/notifications",
        "NOTIFICATIONS_URL",
        "http://localhost:9009",
    ),
];

impl ServiceRoutes {
    pub fn from_env(identity_url: &str) -> Self {
        let routes = ROUTE_TABLE
            .iter()
            .map(|(prefix, key, fallback)| {
                let default = if *key == "IDENTITY_URL" {
                    identity_url
                } else {
                    fallback
                };
                ServiceRoute {
                    prefix: (*prefix).to_string(),
                    base_url: env::var(key).unwrap_or_else(|_| default.to_string()),
                }
            })
            .collect();

        let realtime_ws_url =
            env::var("REALTIME_WS_URL").unwrap_or_else(|_| "ws://localhost:9006/ws".to_string());

        Self::new(routes, realtime_ws_url)
    }

    pub fn new(mut routes: Vec<ServiceRoute>, realtime_ws_url: impl Into<String>) -> Self {
        // Longest prefix first so `/api/v1/posts` wins over a hypothetical
        // `/api/v1` catch-all added later.
        routes.sort_by_key(|route| std::cmp::Reverse(route.prefix.len()));
        Self {
            routes,
            realtime_ws_url: realtime_ws_url.into(),
        }
    }

    pub fn resolve(&self, path: &str) -> Option<&ServiceRoute> {
        self.routes.iter().find(|route| {
            path == route.prefix
                || path
                    .strip_prefix(&route.prefix)
                    .is_some_and(|rest| rest.starts_with('/'))
        })
    }
}

pub fn router(state: GatewayState) -> Router {
    Router::new()
        .route("/ws", get(proxy::ws_proxy))
        .fallback(any(proxy::http_proxy))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth::require_auth,
        ))
        .with_state(state)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn routes() -> ServiceRoutes {
        ServiceRoutes::new(
            vec![
                ServiceRoute {
                    prefix: "/api/v1/posts".into(),
                    base_url: "content".into(),
                },
                ServiceRoute {
                    prefix: "/api/v1/auth".into(),
                    base_url: "identity".into(),
                },
            ],
            "ws://realtime/ws",
        )
    }

    #[test]
    fn resolves_exact_and_nested_paths() {
        assert_eq!(
            routes().resolve("/api/v1/posts").unwrap().base_url,
            "content"
        );
        assert_eq!(
            routes()
                .resolve("/api/v1/posts/123/comments")
                .unwrap()
                .base_url,
            "content"
        );
        assert_eq!(
            routes().resolve("/api/v1/auth/dev-token").unwrap().base_url,
            "identity"
        );
    }

    #[test]
    fn does_not_match_prefix_boundaries() {
        assert!(routes().resolve("/api/v1/postsfoo").is_none());
        assert!(routes().resolve("/api/v1/unknown").is_none());
    }
}
