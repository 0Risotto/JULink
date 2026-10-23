use std::{
    collections::HashMap,
    sync::Arc,
    time::{Duration, Instant},
};

use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct WsUser {
    pub user_id: Uuid,
    pub username: String,
}

#[derive(Debug, Clone)]
struct Ticket {
    user: WsUser,
    expires_at: Instant,
}

#[derive(Clone)]
pub struct TicketStore {
    inner: Arc<RwLock<HashMap<String, Ticket>>>,
}

impl TicketStore {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn issue(&self, user: WsUser, ttl: Duration) -> String {
        let ticket = Uuid::now_v7().to_string();
        let now = Instant::now();
        let mut tickets = self.inner.write().await;

        if tickets.len() > 10_000 {
            tickets.retain(|_, ticket| ticket.expires_at > now);
        }

        tickets.insert(
            ticket.clone(),
            Ticket {
                user,
                expires_at: now + ttl,
            },
        );
        ticket
    }

    pub async fn consume(&self, ticket: &str) -> Option<WsUser> {
        let mut tickets = self.inner.write().await;
        let ticket = tickets.remove(ticket)?;
        (ticket.expires_at > Instant::now()).then_some(ticket.user)
    }
}

impl Default for TicketStore {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn tickets_are_single_use_and_expire() {
        let store = TicketStore::new();
        let user = WsUser {
            user_id: Uuid::now_v7(),
            username: "alice".to_string(),
        };
        let ticket = store.issue(user.clone(), Duration::from_secs(1)).await;

        assert_eq!(
            store.consume(&ticket).await.map(|u| u.username),
            Some("alice".to_string())
        );
        assert!(store.consume(&ticket).await.is_none());

        let expired = store.issue(user, Duration::from_millis(1)).await;
        tokio::time::sleep(Duration::from_millis(10)).await;
        assert!(store.consume(&expired).await.is_none());
    }
}
