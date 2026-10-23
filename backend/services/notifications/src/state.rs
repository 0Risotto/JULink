use async_nats::Client;
use sqlx::PgPool;

use crate::{config::NotificationsConfig, messaging::MessagingClient};

#[derive(Clone)]
pub struct NotificationsState {
    pub db: PgPool,
    pub messaging: MessagingClient,
    pub nats: Option<Client>,
    pub config: NotificationsConfig,
}
