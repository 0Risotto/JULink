use sqlx::PgPool;

#[derive(Clone)]
pub struct ContentState {
    pub db: PgPool,
}
