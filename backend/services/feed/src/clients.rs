use julink_clients::ServiceClient;
use julink_common::AppError;
use julink_proto::{Page, PostView, UserSummary};
use serde::Serialize;
use uuid::Uuid;

#[derive(Clone)]
pub struct SocialClient {
    client: ServiceClient,
}

#[derive(Clone)]
pub struct ContentClient {
    client: ServiceClient,
}

#[derive(Clone)]
pub struct IdentityClient {
    client: ServiceClient,
}

impl SocialClient {
    pub fn new(base_url: &str) -> anyhow::Result<Self> {
        Ok(Self {
            client: ServiceClient::new(base_url)?,
        })
    }

    pub async fn followees(&self, username: &str) -> Result<Vec<String>, AppError> {
        self.client
            .get(&format!(
                "internal/follow/{}/followings?limit=1000",
                username.trim()
            ))
            .await
    }
}

impl ContentClient {
    pub fn new(base_url: &str) -> anyhow::Result<Self> {
        Ok(Self {
            client: ServiceClient::new(base_url)?,
        })
    }

    pub async fn feed(
        &self,
        author_usernames: Option<&[String]>,
        viewer_id: Uuid,
        cursor: Option<&str>,
        limit: u32,
    ) -> Result<Page<PostView>, AppError> {
        #[derive(Serialize)]
        struct Request<'a> {
            author_usernames: Option<&'a [String]>,
            viewer_id: Uuid,
            cursor: Option<&'a str>,
            limit: u32,
        }

        self.client
            .post(
                "internal/posts/feed",
                &Request {
                    author_usernames,
                    viewer_id,
                    cursor,
                    limit,
                },
            )
            .await
    }
}

impl IdentityClient {
    pub fn new(base_url: &str) -> anyhow::Result<Self> {
        Ok(Self {
            client: ServiceClient::new(base_url)?,
        })
    }

    pub async fn users(&self, usernames: &[String]) -> Result<Vec<UserSummary>, AppError> {
        #[derive(Serialize)]
        struct Request<'a> {
            usernames: &'a [String],
        }

        self.client
            .post("internal/users/batch", &Request { usernames })
            .await
    }
}
