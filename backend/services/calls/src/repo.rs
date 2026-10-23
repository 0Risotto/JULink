use std::collections::HashMap;

use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

use julink_common::AppError;
use julink_proto::Page;

use crate::models::{CallParticipant, CallResponse, CallRow, ParticipantRow};

const CALL_COLUMNS: &str = "c.id, c.room_name, c.jitsi_url, c.call_type, c.scope, c.status, \
                            c.created_by, c.conversation_id, c.created_at, c.started_at, c.ended_at";

pub async fn create_direct(
    pool: &PgPool,
    creator_id: Uuid,
    creator_username: &str,
    target_id: Uuid,
    target_username: &str,
    call_type: &str,
    jitsi_base_url: &str,
) -> Result<CallResponse, AppError> {
    let call_id = Uuid::now_v7();
    let room_name = format!("julink-{call_id}");
    let jitsi_url = format!("{jitsi_base_url}/{room_name}");

    let mut tx = pool.begin().await?;
    insert_call(
        &mut tx, call_id, &room_name, &jitsi_url, call_type, "direct", creator_id, None,
    )
    .await?;
    insert_participant(
        &mut tx,
        call_id,
        creator_id,
        creator_username,
        "caller",
        "accepted",
    )
    .await?;
    insert_participant(
        &mut tx,
        call_id,
        target_id,
        target_username,
        "invitee",
        "invited",
    )
    .await?;
    tx.commit().await?;

    get_call(pool, call_id).await
}

pub async fn create_group(
    pool: &PgPool,
    creator_id: Uuid,
    conversation_id: Uuid,
    participants: &[(Uuid, String)],
    call_type: &str,
    jitsi_base_url: &str,
) -> Result<CallResponse, AppError> {
    if participants.len() < 2 {
        return Err(AppError::BadRequest(
            "a group call needs at least two participants".to_string(),
        ));
    }

    let call_id = Uuid::now_v7();
    let room_name = format!("julink-{call_id}");
    let jitsi_url = format!("{jitsi_base_url}/{room_name}");

    let mut tx = pool.begin().await?;
    insert_call(
        &mut tx,
        call_id,
        &room_name,
        &jitsi_url,
        call_type,
        "group",
        creator_id,
        Some(conversation_id),
    )
    .await?;

    for (user_id, username) in participants {
        let (role, status) = if *user_id == creator_id {
            ("caller", "accepted")
        } else {
            ("invitee", "invited")
        };
        insert_participant(&mut tx, call_id, *user_id, username, role, status).await?;
    }

    tx.commit().await?;
    get_call(pool, call_id).await
}

pub async fn get_call(pool: &PgPool, call_id: Uuid) -> Result<CallResponse, AppError> {
    let row = sqlx::query_as::<_, CallRow>(&format!(
        "SELECT {CALL_COLUMNS} FROM call_sessions c WHERE c.id = $1"
    ))
    .bind(call_id)
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::NotFound)?;

    let mut views = load_views(pool, vec![row]).await?;
    views.pop().ok_or(AppError::NotFound)
}

pub async fn accept(pool: &PgPool, user_id: Uuid, call_id: Uuid) -> Result<CallResponse, AppError> {
    let mut tx = pool.begin().await?;
    let call_status = call_status(&mut tx, call_id).await?;
    if call_status != "ringing" && call_status != "active" {
        return Err(AppError::BadRequest(
            "this call is no longer available".to_string(),
        ));
    }

    require_participant(&mut tx, call_id, user_id).await?;
    sqlx::query(
        r#"
        UPDATE call_participants
        SET status = 'accepted', responded_at = now()
        WHERE call_id = $1 AND user_id = $2 AND status = 'invited'
        "#,
    )
    .bind(call_id)
    .bind(user_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        r#"
        UPDATE call_sessions
        SET status = 'active', started_at = COALESCE(started_at, now())
        WHERE id = $1
        "#,
    )
    .bind(call_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    get_call(pool, call_id).await
}

pub async fn decline(
    pool: &PgPool,
    user_id: Uuid,
    call_id: Uuid,
) -> Result<CallResponse, AppError> {
    let mut tx = pool.begin().await?;
    require_participant(&mut tx, call_id, user_id).await?;

    sqlx::query(
        r#"
        UPDATE call_participants
        SET status = 'declined', responded_at = now()
        WHERE call_id = $1 AND user_id = $2 AND status = 'invited'
        "#,
    )
    .bind(call_id)
    .bind(user_id)
    .execute(&mut *tx)
    .await?;

    let scope: String = sqlx::query_scalar("SELECT scope FROM call_sessions WHERE id = $1")
        .bind(call_id)
        .fetch_one(&mut *tx)
        .await?;

    if scope == "direct" {
        let accepted: i64 = sqlx::query_scalar(
            r#"
            SELECT count(*)::bigint FROM call_participants
            WHERE call_id = $1 AND role = 'invitee' AND status = 'accepted'
            "#,
        )
        .bind(call_id)
        .fetch_one(&mut *tx)
        .await?;

        if accepted == 0 {
            sqlx::query(
                "UPDATE call_sessions SET status = 'declined', ended_at = now() WHERE id = $1",
            )
            .bind(call_id)
            .execute(&mut *tx)
            .await?;
        }
    }

    tx.commit().await?;
    get_call(pool, call_id).await
}

pub async fn cancel(pool: &PgPool, user_id: Uuid, call_id: Uuid) -> Result<CallResponse, AppError> {
    let mut tx = pool.begin().await?;
    let creator: Uuid = sqlx::query_scalar("SELECT created_by FROM call_sessions WHERE id = $1")
        .bind(call_id)
        .fetch_optional(&mut *tx)
        .await?
        .ok_or(AppError::NotFound)?;

    if creator != user_id {
        return Err(AppError::Forbidden);
    }

    sqlx::query(
        "UPDATE call_sessions SET status = 'cancelled', ended_at = now() WHERE id = $1 AND status = 'ringing'",
    )
    .bind(call_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    get_call(pool, call_id).await
}

pub async fn end(pool: &PgPool, user_id: Uuid, call_id: Uuid) -> Result<CallResponse, AppError> {
    let mut tx = pool.begin().await?;
    require_participant(&mut tx, call_id, user_id).await?;

    sqlx::query(
        "UPDATE call_participants SET status = 'left', left_at = now() WHERE call_id = $1 AND user_id = $2",
    )
    .bind(call_id)
    .bind(user_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query("UPDATE call_sessions SET status = 'ended', ended_at = now() WHERE id = $1")
        .bind(call_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    get_call(pool, call_id).await
}

pub async fn active_calls(pool: &PgPool, user_id: Uuid) -> Result<Vec<CallResponse>, AppError> {
    let rows = sqlx::query_as::<_, CallRow>(&format!(
        r#"
        SELECT {CALL_COLUMNS}
        FROM call_sessions c
        WHERE c.status IN ('ringing', 'active')
          AND EXISTS (
              SELECT 1 FROM call_participants p
              WHERE p.call_id = c.id AND p.user_id = $1
          )
        ORDER BY c.created_at DESC
        "#
    ))
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    load_views(pool, rows).await
}

pub async fn history(
    pool: &PgPool,
    user_id: Uuid,
    cursor: Option<Uuid>,
    limit: u32,
) -> Result<Page<CallResponse>, AppError> {
    let mut rows = sqlx::query_as::<_, CallRow>(&format!(
        r#"
        SELECT {CALL_COLUMNS}
        FROM call_sessions c
        WHERE EXISTS (
              SELECT 1 FROM call_participants p
              WHERE p.call_id = c.id AND p.user_id = $1
          )
          AND ($2::uuid IS NULL OR (c.created_at, c.id) < (
                SELECT created_at, id FROM call_sessions WHERE id = $2
          ))
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT $3
        "#
    ))
    .bind(user_id)
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
        items: load_views(pool, rows).await?,
        next_cursor,
    })
}

async fn load_views(pool: &PgPool, rows: Vec<CallRow>) -> Result<Vec<CallResponse>, AppError> {
    let ids: Vec<Uuid> = rows.iter().map(|row| row.id).collect();
    let mut participants: HashMap<Uuid, Vec<CallParticipant>> = HashMap::new();

    if !ids.is_empty() {
        let rows = sqlx::query_as::<_, ParticipantRow>(
            r#"
            SELECT call_id, user_id, username, role, status
            FROM call_participants
            WHERE call_id = ANY($1)
            ORDER BY call_id, invited_at, username
            "#,
        )
        .bind(&ids)
        .fetch_all(pool)
        .await?;

        for row in rows {
            participants
                .entry(row.call_id)
                .or_default()
                .push(CallParticipant {
                    user_id: row.user_id,
                    username: row.username,
                    role: row.role,
                    status: row.status,
                });
        }
    }

    Ok(rows
        .into_iter()
        .map(|row| CallResponse {
            id: row.id,
            room_name: row.room_name,
            jitsi_url: row.jitsi_url,
            call_type: row.call_type,
            scope: row.scope,
            status: row.status,
            created_by: row.created_by,
            conversation_id: row.conversation_id,
            participants: participants.remove(&row.id).unwrap_or_default(),
            created_at: row.created_at,
            started_at: row.started_at,
            ended_at: row.ended_at,
        })
        .collect())
}

#[allow(clippy::too_many_arguments)]
async fn insert_call(
    tx: &mut Transaction<'_, Postgres>,
    call_id: Uuid,
    room_name: &str,
    jitsi_url: &str,
    call_type: &str,
    scope: &str,
    created_by: Uuid,
    conversation_id: Option<Uuid>,
) -> Result<(), AppError> {
    sqlx::query(
        r#"
        INSERT INTO call_sessions
            (id, room_name, jitsi_url, call_type, scope, status, created_by, conversation_id)
        VALUES ($1, $2, $3, $4, $5, 'ringing', $6, $7)
        "#,
    )
    .bind(call_id)
    .bind(room_name)
    .bind(jitsi_url)
    .bind(call_type)
    .bind(scope)
    .bind(created_by)
    .bind(conversation_id)
    .execute(&mut **tx)
    .await?;
    Ok(())
}

async fn insert_participant(
    tx: &mut Transaction<'_, Postgres>,
    call_id: Uuid,
    user_id: Uuid,
    username: &str,
    role: &str,
    status: &str,
) -> Result<(), AppError> {
    sqlx::query(
        r#"
        INSERT INTO call_participants
            (call_id, user_id, username, role, status, responded_at)
        VALUES ($1, $2, $3, $4, $5, CASE WHEN $5 = 'accepted' THEN now() ELSE NULL END)
        "#,
    )
    .bind(call_id)
    .bind(user_id)
    .bind(username)
    .bind(role)
    .bind(status)
    .execute(&mut **tx)
    .await?;
    Ok(())
}

async fn call_status(
    tx: &mut Transaction<'_, Postgres>,
    call_id: Uuid,
) -> Result<String, AppError> {
    sqlx::query_scalar("SELECT status FROM call_sessions WHERE id = $1")
        .bind(call_id)
        .fetch_optional(&mut **tx)
        .await?
        .ok_or(AppError::NotFound)
}

async fn require_participant(
    tx: &mut Transaction<'_, Postgres>,
    call_id: Uuid,
    user_id: Uuid,
) -> Result<ParticipantRow, AppError> {
    let participant = sqlx::query_as::<_, ParticipantRow>(
        r#"
        SELECT call_id, user_id, username, role, status
        FROM call_participants
        WHERE call_id = $1 AND user_id = $2
        "#,
    )
    .bind(call_id)
    .bind(user_id)
    .fetch_optional(&mut **tx)
    .await?;

    participant.ok_or(AppError::Forbidden)
}

pub fn normalize_call_type(value: Option<&str>) -> Result<String, AppError> {
    match value.unwrap_or("video") {
        "audio" => Ok("audio".to_string()),
        "video" => Ok("video".to_string()),
        _ => Err(AppError::BadRequest(
            "call type must be `audio` or `video`".to_string(),
        )),
    }
}
