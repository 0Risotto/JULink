use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, patch, post},
};
use serde_json::json;
use uuid::Uuid;

use julink_common::{AppError, auth::CurrentUser};
use julink_proto::Page;

use crate::{
    models::{
        ClaimRequest, CreateLostAndFoundRequest, CreateReportRequest, ListQuery, LostAndFoundView,
    },
    state::CommunityState,
};

pub fn router(state: CommunityState) -> Router {
    Router::new()
        .route("/api/v1/community/ping", get(ping))
        .route("/api/v1/lost-and-founds", get(list).post(create))
        .route("/api/v1/lost-and-founds/{item_id}/resolve", patch(resolve))
        .route("/api/v1/lost-and-founds/{item_id}/claim", post(claim))
        .route("/api/v1/reports", post(create_report))
        .with_state(state)
}

async fn ping() -> Json<serde_json::Value> {
    Json(json!({ "service": "community", "status": "ok" }))
}

async fn create(
    State(state): State<CommunityState>,
    user: CurrentUser,
    Json(request): Json<CreateLostAndFoundRequest>,
) -> Result<(StatusCode, Json<LostAndFoundView>), AppError> {
    if request.description.trim().is_empty() {
        return Err(AppError::BadRequest("description is required".to_string()));
    }
    let kind = request.kind.trim().to_uppercase();
    if kind != "LOST" && kind != "FOUND" {
        return Err(AppError::BadRequest(
            "type must be LOST or FOUND".to_string(),
        ));
    }

    let row = sqlx::query_as::<_, LostAndFoundView>(
        r#"
        INSERT INTO lost_and_found
            (id, owner_id, owner_username, description, college, image_url, phone_number, kind)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, owner_id, owner_username, description, college, image_url,
                  phone_number, kind, is_resolved, created_at
        "#,
    )
    .bind(Uuid::now_v7())
    .bind(user.user_id)
    .bind(&user.username)
    .bind(request.description.trim())
    .bind(request.college.trim())
    .bind(request.image_url.as_deref())
    .bind(request.phone_number.as_deref())
    .bind(&kind)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(row)))
}

async fn list(
    State(state): State<CommunityState>,
    Query(query): Query<ListQuery>,
) -> Result<Json<Page<LostAndFoundView>>, AppError> {
    let limit = query.limit.unwrap_or(20).clamp(1, 100);

    let mut rows = sqlx::query_as::<_, LostAndFoundView>(
        r#"
        SELECT id, owner_id, owner_username, description, college, image_url,
               phone_number, kind, is_resolved, created_at
        FROM lost_and_found
        WHERE ($1::text IS NULL OR college = $1)
          AND ($2::text IS NULL OR kind = $2)
          AND ($3::boolean IS NULL OR is_resolved = $3)
          AND ($4::uuid IS NULL OR (created_at, id) < (
                SELECT created_at, id FROM lost_and_found WHERE id = $4
          ))
        ORDER BY created_at DESC, id DESC
        LIMIT $5
        "#,
    )
    .bind(query.college.as_deref())
    .bind(query.kind.as_deref().map(str::to_uppercase))
    .bind(query.is_resolved)
    .bind(query.cursor)
    .bind(i64::from(limit) + 1)
    .fetch_all(&state.db)
    .await?;

    let next_cursor = if rows.len() > limit as usize {
        rows.truncate(limit as usize);
        rows.last().map(|row| row.id.to_string())
    } else {
        None
    };

    Ok(Json(Page {
        items: rows,
        next_cursor,
    }))
}

async fn resolve(
    State(state): State<CommunityState>,
    user: CurrentUser,
    Path(item_id): Path<Uuid>,
) -> Result<Json<LostAndFoundView>, AppError> {
    let row = sqlx::query_as::<_, LostAndFoundView>(
        r#"
        UPDATE lost_and_found
        SET is_resolved = TRUE
        WHERE id = $1 AND owner_id = $2
        RETURNING id, owner_id, owner_username, description, college, image_url,
                  phone_number, kind, is_resolved, created_at
        "#,
    )
    .bind(item_id)
    .bind(user.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(row))
}

async fn claim(
    State(state): State<CommunityState>,
    user: CurrentUser,
    Path(item_id): Path<Uuid>,
    Json(request): Json<ClaimRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let exists =
        sqlx::query_scalar::<_, bool>("SELECT EXISTS(SELECT 1 FROM lost_and_found WHERE id = $1)")
            .bind(item_id)
            .fetch_one(&state.db)
            .await?;

    if !exists {
        return Err(AppError::NotFound);
    }

    sqlx::query(
        r#"
        INSERT INTO lost_and_found_claims
            (id, item_id, claimant_id, claimant_username, message)
        VALUES ($1, $2, $3, $4, $5)
        "#,
    )
    .bind(Uuid::now_v7())
    .bind(item_id)
    .bind(user.user_id)
    .bind(&user.username)
    .bind(request.message.as_deref())
    .execute(&state.db)
    .await?;

    Ok(Json(json!({
        "status": "success",
        "message": "Claim request sent",
    })))
}

async fn create_report(
    State(state): State<CommunityState>,
    user: CurrentUser,
    Json(request): Json<CreateReportRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    if request.message.trim().is_empty() {
        return Err(AppError::BadRequest("message is required".to_string()));
    }

    let id = Uuid::now_v7();
    sqlx::query(
        r#"
        INSERT INTO reports
            (id, reporter_id, reporter_username, target_type, target_id, message)
        VALUES ($1, $2, $3, $4, $5, $6)
        "#,
    )
    .bind(id)
    .bind(user.user_id)
    .bind(&user.username)
    .bind(request.target_type.to_uppercase())
    .bind(&request.target_id)
    .bind(request.message.trim())
    .execute(&state.db)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(json!({ "status": "success", "id": id })),
    ))
}
