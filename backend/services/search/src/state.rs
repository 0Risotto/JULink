use sqlx::PgPool;

use crate::{
    clients::{ContentClient, IdentityClient},
    config::SearchConfig,
};

#[derive(Clone)]
pub struct SearchState {
    pub db: PgPool,
    pub identity: IdentityClient,
    pub content: ContentClient,
    pub config: SearchConfig,
}
