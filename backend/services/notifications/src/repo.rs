use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::PgPool;
use uuid::Uuid;

use julink_common::AppError;
use julink_proto::Page;

use crate::models::{NotificationRow, NotificationView};

pub async fn list(
    pool: &PgPool,
    recipient_id: Uuid,
    cursor: Option<Uuid>,
    limit: u32,
) -> Result<Page<NotificationView>, AppError> {
    let mut rows = sqlx::query_as::<_, NotificationRow>(
        r#"
        SELECT id, recipient_id, actor_id, actor_username, kind, message,
               target_type, target_id, metadata_json, read_at, created_at
        FROM notifications
        WHERE recipient_id = $1
          AND ($2::uuid IS NULL OR (created_at, id) < (
                SELECT created_at, id FROM notifications WHERE id = $2
          ))
        ORDER BY created_at DESC, id DESC
        LIMIT $3
        "#,
    )
    .bind(recipient_id)
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

pub async fn unread_count(pool: &PgPool, recipient_id: Uuid) -> Result<i64, AppError> {
    Ok(sqlx::query_scalar(
        "SELECT count(*)::bigint FROM notifications WHERE recipient_id = $1 AND read_at IS NULL",
    )
    .bind(recipient_id)
    .fetch_one(pool)
    .await?)
}

pub async fn mark_read(
    pool: &PgPool,
    notification_id: Uuid,
    recipient_id: Uuid,
) -> Result<NotificationView, AppError> {
    let row = sqlx::query_as::<_, NotificationRow>(
        r#"
        UPDATE notifications
        SET read_at = COALESCE(read_at, now())
        WHERE id = $1 AND recipient_id = $2
        RETURNING id, recipient_id, actor_id, actor_username, kind, message,
                  target_type, target_id, metadata_json, read_at, created_at
        "#,
    )
    .bind(notification_id)
    .bind(recipient_id)
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(row.into())
}

pub async fn mark_all_read(pool: &PgPool, recipient_id: Uuid) -> Result<i64, AppError> {
    let result = sqlx::query(
        "UPDATE notifications SET read_at = now() WHERE recipient_id = $1 AND read_at IS NULL",
    )
    .bind(recipient_id)
    .execute(pool)
    .await?;

    Ok(result.rows_affected() as i64)
}

pub async fn delete(
    pool: &PgPool,
    notification_id: Uuid,
    recipient_id: Uuid,
) -> Result<(), AppError> {
    let result = sqlx::query("DELETE FROM notifications WHERE id = $1 AND recipient_id = $2")
        .bind(notification_id)
        .bind(recipient_id)
        .execute(pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}

#[allow(clippy::too_many_arguments)]
pub async fn insert(
    pool: &PgPool,
    recipient_id: Uuid,
    actor_id: Option<Uuid>,
    actor_username: Option<&str>,
    kind: &str,
    message: &str,
    target_type: &str,
    target_id: &str,
    metadata: Option<Value>,
) -> Result<NotificationView, AppError> {
    let metadata_json = metadata.map(|value| value.to_string());

    let row = sqlx::query_as::<_, NotificationRow>(
        r#"
        INSERT INTO notifications
            (recipient_id, actor_id, actor_username, kind, message, target_type, target_id, metadata_json)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, recipient_id, actor_id, actor_username, kind, message,
                  target_type, target_id, metadata_json, read_at, created_at
        "#,
    )
    .bind(recipient_id)
    .bind(actor_id)
    .bind(actor_username)
    .bind(kind)
    .bind(message)
    .bind(target_type)
    .bind(target_id)
    .bind(metadata_json)
    .fetch_one(pool)
    .await?;

    Ok(row.into())
}

pub fn preview(body: Option<&str>) -> String {
    let text = body.unwrap_or("").trim();
    if text.chars().count() > 80 {
        format!("{}…", text.chars().take(80).collect::<String>())
    } else {
        text.to_string()
    }
}

pub fn now() -> DateTime<Utc> {
    Utc::now()
}
