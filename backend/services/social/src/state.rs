use std::sync::Arc;

use neo4rs::Graph;
use sqlx::PgPool;

use julink_common::AppError;

use crate::{config::SocialConfig, identity::IdentityClient};

#[derive(Clone)]
pub struct SocialState {
    pub graph: Option<Arc<Graph>>,
    pub db: Option<PgPool>,
    pub identity: IdentityClient,
    pub config: SocialConfig,
}

impl SocialState {
    pub fn require_graph(&self) -> Result<&Arc<Graph>, AppError> {
        self.graph.as_ref().ok_or_else(|| {
            AppError::Unavailable("the social graph is not configured on this instance".to_string())
        })
    }
}
