use std::collections::{BTreeSet, HashMap};

use serde_json::json;
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

use julink_common::AppError;
use julink_proto::{Page, UserSummary};

use crate::{
    events,
    identity::IdentityClient,
    models::{
        ConversationResponse, ConversationRow, EditMessageRequest, MarkReadRequest, Member,
        MemberRow, MessageResponse, MessageRow, SendMessageRequest, UpdateGroupRequest,
    },
};

const CONVERSATION_COLUMNS: &str = "c.id, c.kind, c.title, c.avatar_url, c.created_by, \
                                    c.created_at, c.last_message_at";

const MESSAGE_COLUMNS: &str = "id, conversation_id, sender_id, sender_username, kind, body, \
                               media_url, shared_post_id, created_at, edited_at, deleted_at";

#[derive(Debug, sqlx::FromRow)]
struct ConversationMeta {
    kind: String,
    created_by: Uuid,
}

pub async fn list_conversations(
    pool: &PgPool,
    viewer: Uuid,
) -> Result<Vec<ConversationResponse>, AppError> {
    let rows = sqlx::query_as::<_, ConversationRow>(&format!(
        r#"
        SELECT {CONVERSATION_COLUMNS}
        FROM conversations c
        JOIN conversation_members m ON m.conversation_id = c.id AND m.user_id = $1
        ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
        "#
    ))
    .bind(viewer)
    .fetch_all(pool)
    .await?;

    build_views(pool, viewer, rows).await
}

pub async fn get_conversation(
    pool: &PgPool,
    viewer: Uuid,
    conversation_id: Uuid,
) -> Result<ConversationResponse, AppError> {
    let row = sqlx::query_as::<_, ConversationRow>(&format!(
        "SELECT {CONVERSATION_COLUMNS} FROM conversations c WHERE c.id = $1"
    ))
    .bind(conversation_id)
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::NotFound)?;

    require_member(pool, conversation_id, viewer).await?;

    let mut views = build_views(pool, viewer, vec![row]).await?;
    views.pop().ok_or(AppError::NotFound)
}

pub async fn create_dm(
    pool: &PgPool,
    identity: &IdentityClient,
    creator_id: Uuid,
    creator_username: &str,
    target_username: &str,
) -> Result<ConversationResponse, AppError> {
    let target = identity.user_by_username(target_username).await?;
    if target.user_id == creator_id {
        return Err(AppError::BadRequest(
            "you cannot create a DM with yourself".to_string(),
        ));
    }

    let mut ids = [creator_id, target.user_id];
    ids.sort();
    let dm_key = format!("{}:{}", ids[0], ids[1]);
    let conversation_id = Uuid::now_v7();

    let mut tx = pool.begin().await?;
    let inserted = sqlx::query(
        r#"
        INSERT INTO conversations (id, kind, dm_key, created_by)
        VALUES ($1, 'dm', $2, $3)
        ON CONFLICT (dm_key) DO NOTHING
        "#,
    )
    .bind(conversation_id)
    .bind(&dm_key)
    .bind(creator_id)
    .execute(&mut *tx)
    .await?
    .rows_affected()
        == 1;

    if inserted {
        insert_member(
            &mut tx,
            conversation_id,
            creator_id,
            creator_username,
            "member",
        )
        .await?;
        insert_member(
            &mut tx,
            conversation_id,
            target.user_id,
            &target.username,
            "member",
        )
        .await?;
        events::record(
            &mut tx,
            events::CONVERSATION_CREATED,
            json!({
                "type": "conversation.created",
                "conversation_id": conversation_id,
                "kind": "dm",
            }),
        )
        .await?;
    }

    let conversation_id =
        sqlx::query_scalar::<_, Uuid>("SELECT id FROM conversations WHERE dm_key = $1")
            .bind(&dm_key)
            .fetch_one(&mut *tx)
            .await?;

    tx.commit().await?;
    get_conversation(pool, creator_id, conversation_id).await
}

pub async fn create_group(
    pool: &PgPool,
    identity: &IdentityClient,
    creator_id: Uuid,
    creator_username: &str,
    title: &str,
    member_usernames: &[String],
    avatar_url: Option<&str>,
) -> Result<ConversationResponse, AppError> {
    validate_title(title)?;
    let users = resolve_users(identity, member_usernames).await?;
    let conversation_id = Uuid::now_v7();

    let mut tx = pool.begin().await?;
    sqlx::query(
        r#"
        INSERT INTO conversations (id, kind, title, avatar_url, created_by)
        VALUES ($1, 'group', $2, $3, $4)
        "#,
    )
    .bind(conversation_id)
    .bind(title.trim())
    .bind(avatar_url)
    .bind(creator_id)
    .execute(&mut *tx)
    .await?;

    insert_member(
        &mut tx,
        conversation_id,
        creator_id,
        creator_username,
        "admin",
    )
    .await?;
    let mut added = 0;
    for user in &users {
        if user.id == creator_id {
            continue;
        }
        insert_member(&mut tx, conversation_id, user.id, &user.username, "member").await?;
        added += 1;
    }

    if added == 0 {
        return Err(AppError::BadRequest(
            "a group needs at least one other member".to_string(),
        ));
    }

    events::record(
        &mut tx,
        events::CONVERSATION_CREATED,
        json!({
            "type": "conversation.created",
            "conversation_id": conversation_id,
            "kind": "group",
        }),
    )
    .await?;

    tx.commit().await?;
    get_conversation(pool, creator_id, conversation_id).await
}

pub async fn update_group(
    pool: &PgPool,
    actor_id: Uuid,
    conversation_id: Uuid,
    request: &UpdateGroupRequest,
) -> Result<ConversationResponse, AppError> {
    let mut tx = pool.begin().await?;
    let meta = conversation_meta(&mut tx, conversation_id).await?;
    if meta.kind != "group" {
        return Err(AppError::BadRequest(
            "only group conversations can be updated".to_string(),
        ));
    }
    require_admin(&mut tx, conversation_id, actor_id).await?;

    if let Some(title) = &request.title {
        validate_title(title)?;
    }

    sqlx::query(
        r#"
        UPDATE conversations
        SET title = COALESCE($1, title),
            avatar_url = COALESCE($2, avatar_url),
            updated_at = now()
        WHERE id = $3
        "#,
    )
    .bind(request.title.as_deref().map(str::trim))
    .bind(request.avatar_url.as_deref())
    .bind(conversation_id)
    .execute(&mut *tx)
    .await?;

    events::record(
        &mut tx,
        events::CONVERSATION_UPDATED,
        json!({
            "type": "conversation.updated",
            "conversation_id": conversation_id,
        }),
    )
    .await?;

    tx.commit().await?;
    get_conversation(pool, actor_id, conversation_id).await
}

pub async fn add_members(
    pool: &PgPool,
    identity: &IdentityClient,
    actor_id: Uuid,
    conversation_id: Uuid,
    usernames: &[String],
) -> Result<ConversationResponse, AppError> {
    let mut tx = pool.begin().await?;
    let meta = conversation_meta(&mut tx, conversation_id).await?;
    if meta.kind != "group" {
        return Err(AppError::BadRequest(
            "only group conversations accept new members".to_string(),
        ));
    }
    require_admin(&mut tx, conversation_id, actor_id).await?;

    let users = resolve_users(identity, usernames).await?;
    for user in &users {
        insert_member(&mut tx, conversation_id, user.id, &user.username, "member").await?;
    }

    events::record(
        &mut tx,
        events::MEMBERS_ADDED,
        json!({
            "type": "members.added",
            "conversation_id": conversation_id,
        }),
    )
    .await?;

    tx.commit().await?;
    get_conversation(pool, actor_id, conversation_id).await
}

pub async fn remove_member(
    pool: &PgPool,
    identity: &IdentityClient,
    actor_id: Uuid,
    conversation_id: Uuid,
    target_username: &str,
) -> Result<ConversationResponse, AppError> {
    let target = identity.user_by_username(target_username).await?;
    let mut tx = pool.begin().await?;
    let meta = conversation_meta(&mut tx, conversation_id).await?;
    require_admin(&mut tx, conversation_id, actor_id).await?;

    if target.user_id == meta.created_by {
        return Err(AppError::BadRequest(
            "the group creator cannot be removed".to_string(),
        ));
    }

    sqlx::query("DELETE FROM conversation_members WHERE conversation_id = $1 AND user_id = $2")
        .bind(conversation_id)
        .bind(target.user_id)
        .execute(&mut *tx)
        .await?;

    events::record(
        &mut tx,
        events::MEMBER_REMOVED,
        json!({
            "type": "member.removed",
            "conversation_id": conversation_id,
            "user_id": target.user_id,
        }),
    )
    .await?;

    tx.commit().await?;
    get_conversation(pool, actor_id, conversation_id).await
}

pub async fn leave(pool: &PgPool, actor_id: Uuid, conversation_id: Uuid) -> Result<(), AppError> {
    let mut tx = pool.begin().await?;
    require_member_tx(&mut tx, conversation_id, actor_id).await?;

    sqlx::query("DELETE FROM conversation_members WHERE conversation_id = $1 AND user_id = $2")
        .bind(conversation_id)
        .bind(actor_id)
        .execute(&mut *tx)
        .await?;

    let remaining: i64 = sqlx::query_scalar(
        "SELECT count(*)::bigint FROM conversation_members WHERE conversation_id = $1",
    )
    .bind(conversation_id)
    .fetch_one(&mut *tx)
    .await?;

    if remaining == 0 {
        sqlx::query("DELETE FROM conversations WHERE id = $1")
            .bind(conversation_id)
            .execute(&mut *tx)
            .await?;
    }

    events::record(
        &mut tx,
        events::MEMBER_REMOVED,
        json!({
            "type": "member.removed",
            "conversation_id": conversation_id,
            "user_id": actor_id,
        }),
    )
    .await?;

    tx.commit().await?;
    Ok(())
}

pub async fn set_admin(
    pool: &PgPool,
    identity: &IdentityClient,
    actor_id: Uuid,
    conversation_id: Uuid,
    target_username: &str,
    admin: bool,
) -> Result<ConversationResponse, AppError> {
    let target = identity.user_by_username(target_username).await?;
    let mut tx = pool.begin().await?;
    let meta = conversation_meta(&mut tx, conversation_id).await?;
    if meta.kind != "group" {
        return Err(AppError::BadRequest("only groups have admins".to_string()));
    }
    require_admin(&mut tx, conversation_id, actor_id).await?;

    if target.user_id == meta.created_by && !admin {
        return Err(AppError::BadRequest(
            "the group creator must remain an admin".to_string(),
        ));
    }

    let updated = sqlx::query(
        "UPDATE conversation_members SET role = $1 WHERE conversation_id = $2 AND user_id = $3",
    )
    .bind(if admin { "admin" } else { "member" })
    .bind(conversation_id)
    .bind(target.user_id)
    .execute(&mut *tx)
    .await?;

    if updated.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }

    tx.commit().await?;
    get_conversation(pool, actor_id, conversation_id).await
}

pub async fn list_messages(
    pool: &PgPool,
    viewer: Uuid,
    conversation_id: Uuid,
    cursor: Option<Uuid>,
    limit: u32,
) -> Result<Page<MessageResponse>, AppError> {
    require_member(pool, conversation_id, viewer).await?;

    let mut rows = sqlx::query_as::<_, MessageRow>(&format!(
        r#"
        SELECT {MESSAGE_COLUMNS}
        FROM messages
        WHERE conversation_id = $1
          AND deleted_at IS NULL
          AND ($2::uuid IS NULL OR (created_at, id) < (
                SELECT created_at, id FROM messages WHERE id = $2
          ))
        ORDER BY created_at DESC, id DESC
        LIMIT $3
        "#
    ))
    .bind(conversation_id)
    .bind(cursor)
    .bind(i64::from(limit) + 1)
    .fetch_all(pool)
    .await?;

    let next_cursor = if rows.len() > limit as usize {
        rows.truncate(limit as usize);
        rows.last().map(|row| row.id.to_string())
    } else {
        None
    };

    Ok(Page {
        items: rows.into_iter().map(Into::into).collect(),
        next_cursor,
    })
}

pub async fn send_message(
    pool: &PgPool,
    user_id: Uuid,
    username: &str,
    conversation_id: Uuid,
    request: &SendMessageRequest,
) -> Result<MessageResponse, AppError> {
    let (kind, body, media_url, shared_post_id) = normalize_message(request)?;
    let message_id = Uuid::now_v7();

    let mut tx = pool.begin().await?;
    require_member_tx(&mut tx, conversation_id, user_id).await?;

    let row = sqlx::query_as::<_, MessageRow>(&format!(
        r#"
        INSERT INTO messages
            (id, conversation_id, sender_id, sender_username, kind, body, media_url, shared_post_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING {MESSAGE_COLUMNS}
        "#
    ))
    .bind(message_id)
    .bind(conversation_id)
    .bind(user_id)
    .bind(username)
    .bind(&kind)
    .bind(&body)
    .bind(&media_url)
    .bind(shared_post_id)
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query(
        "UPDATE conversations SET last_message_at = now(), updated_at = now() WHERE id = $1",
    )
    .bind(conversation_id)
    .execute(&mut *tx)
    .await?;

    let message: MessageResponse = row.into();
    events::record(
        &mut tx,
        events::MESSAGE_CREATED,
        json!({
            "type": "message.created",
            "conversation_id": conversation_id,
            "message": &message,
        }),
    )
    .await?;

    tx.commit().await?;
    Ok(message)
}

pub async fn edit_message(
    pool: &PgPool,
    user_id: Uuid,
    message_id: Uuid,
    request: &EditMessageRequest,
) -> Result<MessageResponse, AppError> {
    let body = request.body.trim();
    if body.is_empty() || body.chars().count() > 4000 {
        return Err(AppError::BadRequest(
            "message body must be 1-4000 characters".to_string(),
        ));
    }

    let mut tx = pool.begin().await?;
    let existing = sqlx::query_as::<_, MessageRow>(&format!(
        "SELECT {MESSAGE_COLUMNS} FROM messages WHERE id = $1 AND deleted_at IS NULL FOR UPDATE"
    ))
    .bind(message_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or(AppError::NotFound)?;

    if existing.sender_id != user_id {
        return Err(AppError::Forbidden);
    }

    let row = sqlx::query_as::<_, MessageRow>(&format!(
        r#"
        UPDATE messages SET body = $1, edited_at = now()
        WHERE id = $2
        RETURNING {MESSAGE_COLUMNS}
        "#
    ))
    .bind(body)
    .bind(message_id)
    .fetch_one(&mut *tx)
    .await?;

    let message: MessageResponse = row.into();
    events::record(
        &mut tx,
        events::MESSAGE_UPDATED,
        json!({
            "type": "message.updated",
            "conversation_id": message.conversation_id,
            "message": &message,
        }),
    )
    .await?;

    tx.commit().await?;
    Ok(message)
}

pub async fn delete_message(
    pool: &PgPool,
    user_id: Uuid,
    message_id: Uuid,
) -> Result<(), AppError> {
    let mut tx = pool.begin().await?;
    let existing = sqlx::query_as::<_, MessageRow>(&format!(
        "SELECT {MESSAGE_COLUMNS} FROM messages WHERE id = $1 AND deleted_at IS NULL FOR UPDATE"
    ))
    .bind(message_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or(AppError::NotFound)?;

    if existing.sender_id != user_id {
        return Err(AppError::Forbidden);
    }

    let row = sqlx::query_as::<_, MessageRow>(&format!(
        r#"
        UPDATE messages SET deleted_at = now()
        WHERE id = $1
        RETURNING {MESSAGE_COLUMNS}
        "#
    ))
    .bind(message_id)
    .fetch_one(&mut *tx)
    .await?;

    let message: MessageResponse = row.into();
    events::record(
        &mut tx,
        events::MESSAGE_DELETED,
        json!({
            "type": "message.deleted",
            "conversation_id": existing.conversation_id,
            "message_id": message_id,
            "message": message,
        }),
    )
    .await?;

    tx.commit().await?;
    Ok(())
}

pub async fn mark_read(
    pool: &PgPool,
    user_id: Uuid,
    username: &str,
    conversation_id: Uuid,
    request: &MarkReadRequest,
) -> Result<(), AppError> {
    let mut tx = pool.begin().await?;
    require_member_tx(&mut tx, conversation_id, user_id).await?;

    let belongs: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM messages WHERE id = $1 AND conversation_id = $2)",
    )
    .bind(request.message_id)
    .bind(conversation_id)
    .fetch_one(&mut *tx)
    .await?;

    if !belongs {
        return Err(AppError::NotFound);
    }

    sqlx::query(
        r#"
        UPDATE conversation_members
        SET last_read_message_id = $1, last_read_at = now()
        WHERE conversation_id = $2 AND user_id = $3
        "#,
    )
    .bind(request.message_id)
    .bind(conversation_id)
    .bind(user_id)
    .execute(&mut *tx)
    .await?;

    events::record(
        &mut tx,
        events::READ_UPDATED,
        json!({
            "type": "read.updated",
            "conversation_id": conversation_id,
            "user_id": user_id,
            "username": username,
            "last_read_message_id": request.message_id,
        }),
    )
    .await?;

    tx.commit().await?;
    Ok(())
}

pub async fn is_member(
    pool: &PgPool,
    conversation_id: Uuid,
    user_id: Uuid,
) -> Result<bool, AppError> {
    let member = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2)",
    )
    .bind(conversation_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(member)
}

pub async fn members(pool: &PgPool, conversation_id: Uuid) -> Result<Vec<Member>, AppError> {
    let rows = sqlx::query_as::<_, MemberRow>(
        r#"
        SELECT conversation_id, user_id, username, role
        FROM conversation_members
        WHERE conversation_id = $1
        ORDER BY joined_at, username
        "#,
    )
    .bind(conversation_id)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| Member {
            user_id: row.user_id,
            username: row.username,
            role: row.role,
        })
        .collect())
}

async fn build_views(
    pool: &PgPool,
    viewer: Uuid,
    rows: Vec<ConversationRow>,
) -> Result<Vec<ConversationResponse>, AppError> {
    let ids: Vec<Uuid> = rows.iter().map(|row| row.id).collect();
    let members = load_members(pool, &ids).await?;
    let last_messages = load_last_messages(pool, &ids).await?;
    let unread = load_unread(pool, viewer, &ids).await?;

    Ok(rows
        .into_iter()
        .map(|row| ConversationResponse {
            id: row.id,
            kind: row.kind,
            title: row.title,
            avatar_url: row.avatar_url,
            created_by: row.created_by,
            members: members.get(&row.id).cloned().unwrap_or_default(),
            last_message: last_messages.get(&row.id).cloned(),
            unread_count: unread.get(&row.id).copied().unwrap_or(0),
            created_at: row.created_at,
            last_message_at: row.last_message_at,
        })
        .collect())
}

async fn load_members(pool: &PgPool, ids: &[Uuid]) -> Result<HashMap<Uuid, Vec<Member>>, AppError> {
    if ids.is_empty() {
        return Ok(HashMap::new());
    }

    let rows = sqlx::query_as::<_, MemberRow>(
        r#"
        SELECT conversation_id, user_id, username, role
        FROM conversation_members
        WHERE conversation_id = ANY($1)
        ORDER BY conversation_id, joined_at, username
        "#,
    )
    .bind(ids)
    .fetch_all(pool)
    .await?;

    let mut grouped: HashMap<Uuid, Vec<Member>> = HashMap::new();
    for row in rows {
        grouped
            .entry(row.conversation_id)
            .or_default()
            .push(Member {
                user_id: row.user_id,
                username: row.username,
                role: row.role,
            });
    }
    Ok(grouped)
}

async fn load_last_messages(
    pool: &PgPool,
    ids: &[Uuid],
) -> Result<HashMap<Uuid, MessageResponse>, AppError> {
    if ids.is_empty() {
        return Ok(HashMap::new());
    }

    let rows = sqlx::query_as::<_, MessageRow>(&format!(
        r#"
        SELECT DISTINCT ON (conversation_id) {MESSAGE_COLUMNS}
        FROM messages
        WHERE conversation_id = ANY($1) AND deleted_at IS NULL
        ORDER BY conversation_id, created_at DESC, id DESC
        "#
    ))
    .bind(ids)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| (row.conversation_id, row.into()))
        .collect())
}

async fn load_unread(
    pool: &PgPool,
    viewer: Uuid,
    ids: &[Uuid],
) -> Result<HashMap<Uuid, i64>, AppError> {
    if ids.is_empty() {
        return Ok(HashMap::new());
    }

    let rows = sqlx::query_as::<_, (Uuid, i64)>(
        r#"
        SELECT m.conversation_id, count(*)::bigint
        FROM messages m
        JOIN conversation_members mem
          ON mem.conversation_id = m.conversation_id AND mem.user_id = $1
        WHERE m.conversation_id = ANY($2)
          AND m.deleted_at IS NULL
          AND m.sender_id <> $1
          AND (mem.last_read_at IS NULL OR m.created_at > mem.last_read_at)
        GROUP BY m.conversation_id
        "#,
    )
    .bind(viewer)
    .bind(ids)
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().collect())
}

async fn require_member(
    pool: &PgPool,
    conversation_id: Uuid,
    user_id: Uuid,
) -> Result<MemberRow, AppError> {
    let member = sqlx::query_as::<_, MemberRow>(
        r#"
        SELECT conversation_id, user_id, username, role
        FROM conversation_members
        WHERE conversation_id = $1 AND user_id = $2
        "#,
    )
    .bind(conversation_id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    member.ok_or(AppError::Forbidden)
}

async fn require_member_tx(
    tx: &mut Transaction<'_, Postgres>,
    conversation_id: Uuid,
    user_id: Uuid,
) -> Result<MemberRow, AppError> {
    let member = sqlx::query_as::<_, MemberRow>(
        r#"
        SELECT conversation_id, user_id, username, role
        FROM conversation_members
        WHERE conversation_id = $1 AND user_id = $2
        "#,
    )
    .bind(conversation_id)
    .bind(user_id)
    .fetch_optional(&mut **tx)
    .await?;

    member.ok_or(AppError::Forbidden)
}

async fn require_admin(
    tx: &mut Transaction<'_, Postgres>,
    conversation_id: Uuid,
    user_id: Uuid,
) -> Result<(), AppError> {
    let member = require_member_tx(tx, conversation_id, user_id).await?;
    if member.role == "admin" {
        Ok(())
    } else {
        Err(AppError::Forbidden)
    }
}

async fn conversation_meta(
    tx: &mut Transaction<'_, Postgres>,
    conversation_id: Uuid,
) -> Result<ConversationMeta, AppError> {
    sqlx::query_as::<_, ConversationMeta>(
        "SELECT kind, created_by FROM conversations WHERE id = $1",
    )
    .bind(conversation_id)
    .fetch_optional(&mut **tx)
    .await?
    .ok_or(AppError::NotFound)
}

async fn insert_member(
    tx: &mut Transaction<'_, Postgres>,
    conversation_id: Uuid,
    user_id: Uuid,
    username: &str,
    role: &str,
) -> Result<(), AppError> {
    sqlx::query(
        r#"
        INSERT INTO conversation_members (conversation_id, user_id, username, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (conversation_id, user_id) DO NOTHING
        "#,
    )
    .bind(conversation_id)
    .bind(user_id)
    .bind(username)
    .bind(role)
    .execute(&mut **tx)
    .await?;
    Ok(())
}

async fn resolve_users(
    identity: &IdentityClient,
    usernames: &[String],
) -> Result<Vec<UserSummary>, AppError> {
    let unique: Vec<String> = usernames
        .iter()
        .map(|username| username.trim().to_lowercase())
        .filter(|username| !username.is_empty())
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect();

    if unique.len() > 100 {
        return Err(AppError::BadRequest(
            "at most 100 users may be added at once".to_string(),
        ));
    }

    let users = identity.users_by_usernames(&unique).await?;
    if users.len() != unique.len() {
        return Err(AppError::NotFound);
    }
    Ok(users)
}

fn validate_title(title: &str) -> Result<(), AppError> {
    let length = title.trim().chars().count();
    if !(1..=100).contains(&length) {
        return Err(AppError::BadRequest(
            "group title must be 1-100 characters".to_string(),
        ));
    }
    Ok(())
}

type NormalizedMessage = (String, Option<String>, Option<String>, Option<Uuid>);

fn normalize_message(request: &SendMessageRequest) -> Result<NormalizedMessage, AppError> {
    let kind = request
        .kind
        .as_deref()
        .unwrap_or("text")
        .trim()
        .to_lowercase();
    let body = request
        .body
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);
    let media_url = request
        .media_url
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);

    if let Some(body) = &body {
        if body.chars().count() > 4000 {
            return Err(AppError::BadRequest(
                "message body must be at most 4000 characters".to_string(),
            ));
        }
    }

    match kind.as_str() {
        "text" => {
            let body = body
                .ok_or_else(|| AppError::BadRequest("text messages require a body".to_string()))?;
            Ok((kind, Some(body), None, None))
        }
        "image" | "video" | "file" | "audio" => {
            let media_url = media_url.ok_or_else(|| {
                AppError::BadRequest("media messages require a media url".to_string())
            })?;
            if !(media_url.starts_with("http://")
                || media_url.starts_with("https://")
                || media_url.starts_with('/'))
            {
                return Err(AppError::BadRequest(
                    "media url must be absolute or start with `/`".to_string(),
                ));
            }
            Ok((kind, body, Some(media_url), None))
        }
        "post_share" => {
            let shared_post_id = request.shared_post_id.ok_or_else(|| {
                AppError::BadRequest("post shares require shared_post_id".to_string())
            })?;
            Ok((kind, body, None, Some(shared_post_id)))
        }
        _ => Err(AppError::BadRequest("unsupported message kind".to_string())),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_message_shapes() {
        let text = SendMessageRequest {
            kind: None,
            body: Some("hello".to_string()),
            media_url: None,
            shared_post_id: None,
        };
        assert!(normalize_message(&text).is_ok());

        let empty = SendMessageRequest {
            kind: Some("text".to_string()),
            body: None,
            media_url: None,
            shared_post_id: None,
        };
        assert!(normalize_message(&empty).is_err());

        let image = SendMessageRequest {
            kind: Some("image".to_string()),
            body: None,
            media_url: Some("https://example.com/a.png".to_string()),
            shared_post_id: None,
        };
        assert!(normalize_message(&image).is_ok());

        let bad_share = SendMessageRequest {
            kind: Some("post_share".to_string()),
            body: None,
            media_url: None,
            shared_post_id: None,
        };
        assert!(normalize_message(&bad_share).is_err());
    }

    #[test]
    fn validates_titles() {
        assert!(validate_title("Study group").is_ok());
        assert!(validate_title("").is_err());
    }
}
