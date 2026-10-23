use julink_clients::ServiceClient;
use julink_common::AppError;
use julink_proto::{Page, PostView, UserSummary};

#[derive(Clone)]
pub struct IdentityClient {
    client: ServiceClient,
}

#[derive(Clone)]
pub struct ContentClient {
    client: ServiceClient,
}

impl IdentityClient {
    pub fn new(base_url: &str) -> anyhow::Result<Self> {
        Ok(Self {
            client: ServiceClient::new(base_url)?,
        })
    }

    pub async fn users(&self, limit: u32, offset: u32) -> Result<Vec<UserSummary>, AppError> {
        self.client
            .get(&format!("internal/users?limit={limit}&offset={offset}"))
            .await
    }
}

impl ContentClient {
    pub fn new(base_url: &str) -> anyhow::Result<Self> {
        Ok(Self {
            client: ServiceClient::new(base_url)?,
        })
    }

    pub async fn posts(
        &self,
        cursor: Option<&str>,
        limit: u32,
    ) -> Result<Page<PostView>, AppError> {
        let mut path = format!("internal/posts?limit={limit}");
        if let Some(cursor) = cursor {
            path.push_str("&cursor=");
            path.push_str(cursor);
        }
        self.client.get(&path).await
    }
}
