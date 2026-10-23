use julink_common::AppError;

use crate::{config::RealtimeConfig, hub::Hub, messaging::MessagingClient, tickets::TicketStore};

#[derive(Clone)]
pub struct RealtimeState {
    pub hub: Hub,
    pub tickets: TicketStore,
    pub messaging: MessagingClient,
    pub config: RealtimeConfig,
}

impl RealtimeState {
    pub fn new(config: RealtimeConfig) -> Result<Self, AppError> {
        Ok(Self {
            hub: Hub::new(),
            tickets: TicketStore::new(),
            messaging: MessagingClient::new(&config.messaging_url),
            config,
        })
    }
}
