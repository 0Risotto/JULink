use julink_proto::{PostView, UserSummary};
use serde::Serialize;

use crate::{
    cache::FolloweeCache,
    clients::{ContentClient, IdentityClient, SocialClient},
};

#[derive(Clone)]
pub struct FeedState {
    pub social: SocialClient,
    pub content: ContentClient,
    pub identity: IdentityClient,
    pub cache: FolloweeCache,
}

#[derive(Debug, Clone, Serialize)]
pub struct FeedItem {
    pub post: PostView,
    pub author: UserSummary,
}

#[derive(Debug, Clone, Serialize)]
pub struct FeedPage {
    pub items: Vec<FeedItem>,
    pub next_cursor: Option<String>,
}
