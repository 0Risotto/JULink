use julink_proto::{PostView, UserSummary};
use sqlx::PgPool;

use crate::state::SearchState;

pub async fn run(state: SearchState) {
    loop {
        if let Err(error) = sync_once(&state).await {
            tracing::warn!(%error, "search sync failed");
        }
        tokio::time::sleep(state.config.sync_interval).await;
    }
}

pub async fn sync_once(state: &SearchState) -> anyhow::Result<()> {
    sync_users(state).await?;
    sync_posts(state).await?;
    tracing::info!("search read model synchronized");
    Ok(())
}

async fn sync_users(state: &SearchState) -> anyhow::Result<()> {
    let page_size = state.config.sync_page_size;
    let mut offset = 0;

    for _ in 0..state.config.sync_max_pages {
        let users = state.identity.users(page_size, offset).await?;
        let received = users.len();
        for user in &users {
            upsert_user(&state.db, user).await?;
        }

        if received < page_size as usize {
            break;
        }
        offset = offset.saturating_add(received as u32);
    }

    Ok(())
}

async fn sync_posts(state: &SearchState) -> anyhow::Result<()> {
    let page_size = state.config.sync_page_size;
    let mut cursor: Option<String> = None;

    for _ in 0..state.config.sync_max_pages {
        let page = state.content.posts(cursor.as_deref(), page_size).await?;
        for post in &page.items {
            upsert_post(&state.db, post).await?;
        }
        cursor = page.next_cursor;
        if cursor.is_none() {
            break;
        }
    }

    Ok(())
}

async fn upsert_user(pool: &PgPool, user: &UserSummary) -> anyhow::Result<()> {
    sqlx::query(
        r#"
        INSERT INTO search_users
            (id, username, display_name, avatar_url, updated_at, search_vector)
        VALUES ($1, $2, $3, $4, now(), to_tsvector('simple', $2 || ' ' || $3))
        ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            display_name = EXCLUDED.display_name,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = now(),
            search_vector = EXCLUDED.search_vector
        "#,
    )
    .bind(user.id)
    .bind(&user.username)
    .bind(&user.display_name)
    .bind(&user.avatar_url)
    .execute(pool)
    .await?;

    Ok(())
}

async fn upsert_post(pool: &PgPool, post: &PostView) -> anyhow::Result<()> {
    sqlx::query(
        r#"
        INSERT INTO search_posts
            (id, author_id, author_username, body, hashtags, created_at, updated_at, search_vector)
        VALUES (
            $1, $2, $3, $4, $5, $6, now(),
            to_tsvector('simple', $4 || ' ' || array_to_string($5, ' '))
        )
        ON CONFLICT (id) DO UPDATE SET
            author_id = EXCLUDED.author_id,
            author_username = EXCLUDED.author_username,
            body = EXCLUDED.body,
            hashtags = EXCLUDED.hashtags,
            updated_at = now(),
            search_vector = EXCLUDED.search_vector
        "#,
    )
    .bind(post.id)
    .bind(post.author_id)
    .bind(&post.author_username)
    .bind(&post.body)
    .bind(&post.hashtags)
    .bind(post.created_at)
    .execute(pool)
    .await?;

    Ok(())
}
