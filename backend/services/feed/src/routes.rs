use std::collections::{BTreeSet, HashMap};

use axum::{
    Json, Router,
    extract::{Query, State},
    routing::get,
};
use uuid::Uuid;

use julink_common::{AppError, auth::CurrentUser, pagination::PageQuery};
use julink_proto::{Page, PostView, UserSummary};

use crate::state::{FeedItem, FeedPage, FeedState};

pub fn router(state: FeedState) -> Router {
    Router::new()
        .route("/api/v1/feed", get(home_feed))
        .route("/api/v1/trending", get(trending))
        .with_state(state)
}

async fn home_feed(
    State(state): State<FeedState>,
    user: CurrentUser,
    Query(query): Query<PageQuery>,
) -> Result<Json<FeedPage>, AppError> {
    let cursor = parse_cursor(&query)?;

    let followees = match state.cache.get(&user.username).await {
        Some(cached) => Some(cached),
        None => match state.social.followees(&user.username).await {
            Ok(followees) => {
                state
                    .cache
                    .put(user.username.clone(), followees.clone())
                    .await;
                Some(followees)
            }
            Err(error) => {
                tracing::warn!(%error, "social unavailable; serving the global feed");
                None
            }
        },
    };

    let authors = followees.map(|mut usernames| {
        if !usernames
            .iter()
            .any(|username| username.eq_ignore_ascii_case(&user.username))
        {
            usernames.push(user.username.clone());
        }
        usernames
    });

    let mut page = state
        .content
        .feed(authors.as_deref(), user.user_id, cursor, query.limit())
        .await?;

    // A brand-new account with no follows still sees something useful.
    if page.items.is_empty() && authors.is_some() && cursor.is_none() {
        page = state
            .content
            .feed(None, user.user_id, None, query.limit())
            .await?;
    }

    Ok(Json(enrich(&state, page).await?))
}

async fn trending(
    State(state): State<FeedState>,
    user: CurrentUser,
    Query(query): Query<PageQuery>,
) -> Result<Json<FeedPage>, AppError> {
    let cursor = parse_cursor(&query)?;
    let page = state
        .content
        .feed(None, user.user_id, cursor, query.limit())
        .await?;
    Ok(Json(enrich(&state, page).await?))
}

async fn enrich(state: &FeedState, page: Page<PostView>) -> Result<FeedPage, AppError> {
    let usernames: Vec<String> = page
        .items
        .iter()
        .map(|post| post.author_username.clone())
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect();

    let cards = if usernames.is_empty() {
        Vec::new()
    } else {
        match state.identity.users(&usernames).await {
            Ok(cards) => cards,
            Err(error) => {
                tracing::warn!(%error, "identity unavailable; using author fallbacks");
                Vec::new()
            }
        }
    };

    let cards: HashMap<String, UserSummary> = cards
        .into_iter()
        .map(|card| (card.username.to_lowercase(), card))
        .collect();

    let items = page
        .items
        .into_iter()
        .map(|post| {
            let author = cards
                .get(&post.author_username.to_lowercase())
                .cloned()
                .unwrap_or_else(|| UserSummary {
                    id: post.author_id,
                    username: post.author_username.clone(),
                    display_name: post.author_username.clone(),
                    avatar_url: None,
                });
            FeedItem { post, author }
        })
        .collect();

    Ok(FeedPage {
        items,
        next_cursor: page.next_cursor,
    })
}

fn parse_cursor(query: &PageQuery) -> Result<Option<&str>, AppError> {
    if let Some(value) = query.cursor.as_deref() {
        if !value.is_empty() {
            Uuid::parse_str(value)
                .map_err(|_| AppError::BadRequest("invalid cursor".to_string()))?;
            return Ok(Some(value));
        }
    }
    Ok(None)
}
