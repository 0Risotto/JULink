use std::{collections::HashMap, sync::Arc};

use tokio::sync::{RwLock, mpsc::UnboundedSender};
use uuid::Uuid;

type RoomMap = HashMap<String, HashMap<Uuid, UnboundedSender<String>>>;

#[derive(Clone)]
pub struct Hub {
    rooms: Arc<RwLock<RoomMap>>,
}

impl Hub {
    pub fn new() -> Self {
        Self {
            rooms: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn join(&self, room: String, connection_id: Uuid, sender: UnboundedSender<String>) {
        self.rooms
            .write()
            .await
            .entry(room)
            .or_default()
            .insert(connection_id, sender);
    }

    pub async fn leave(&self, room: &str, connection_id: Uuid) {
        let mut rooms = self.rooms.write().await;
        if let Some(connections) = rooms.get_mut(room) {
            connections.remove(&connection_id);
            if connections.is_empty() {
                rooms.remove(room);
            }
        }
    }

    pub async fn leave_all(&self, connection_id: Uuid) {
        let mut rooms = self.rooms.write().await;
        rooms.retain(|_, connections| {
            connections.remove(&connection_id);
            !connections.is_empty()
        });
    }

    pub async fn broadcast(&self, room: &str, payload: String) {
        let mut rooms = self.rooms.write().await;
        if let Some(connections) = rooms.get_mut(room) {
            connections.retain(|_, sender| sender.send(payload.clone()).is_ok());
            if connections.is_empty() {
                rooms.remove(room);
            }
        }
    }
}

impl Default for Hub {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::sync::mpsc;

    #[tokio::test]
    async fn broadcasts_to_a_room() {
        let hub = Hub::new();
        let connection = Uuid::now_v7();
        let (tx, mut rx) = mpsc::unbounded_channel();
        hub.join("conversation:1".to_string(), connection, tx).await;

        hub.broadcast("conversation:1", "hello".to_string()).await;
        assert_eq!(rx.recv().await.as_deref(), Some("hello"));

        hub.leave_all(connection).await;
        hub.broadcast("conversation:1", "gone".to_string()).await;
        assert!(rx.try_recv().is_err());
    }
}
