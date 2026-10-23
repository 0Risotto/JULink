use sqlx::PgPool;

#[derive(Clone)]
pub struct CommunityState {
    pub db: PgPool,
}
