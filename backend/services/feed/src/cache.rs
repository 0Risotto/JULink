use std::{
    collections::HashMap,
    sync::Arc,
    time::{Duration, Instant},
};

use tokio::sync::RwLock;

#[derive(Clone)]
pub struct FolloweeCache {
    inner: Arc<RwLock<HashMap<String, Entry>>>,
    ttl: Duration,
}

struct Entry {
    usernames: Vec<String>,
    expires_at: Instant,
}

impl FolloweeCache {
    pub fn new(ttl: Duration) -> Self {
        Self {
            inner: Arc::new(RwLock::new(HashMap::new())),
            ttl,
        }
    }

    pub async fn get(&self, username: &str) -> Option<Vec<String>> {
        let cache = self.inner.read().await;
        cache
            .get(&username.to_lowercase())
            .and_then(|entry| (entry.expires_at > Instant::now()).then(|| entry.usernames.clone()))
    }

    pub async fn put(&self, username: String, usernames: Vec<String>) {
        let mut cache = self.inner.write().await;

        if cache.len() > 10_000 {
            let now = Instant::now();
            cache.retain(|_, entry| entry.expires_at > now);
        }

        cache.insert(
            username.to_lowercase(),
            Entry {
                usernames,
                expires_at: Instant::now() + self.ttl,
            },
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn caches_and_expires() {
        let cache = FolloweeCache::new(Duration::from_millis(20));
        cache
            .put("Alice".to_string(), vec!["bob".to_string()])
            .await;
        assert_eq!(cache.get("alice").await, Some(vec!["bob".to_string()]));

        tokio::time::sleep(Duration::from_millis(30)).await;
        assert_eq!(cache.get("alice").await, None);
    }
}
