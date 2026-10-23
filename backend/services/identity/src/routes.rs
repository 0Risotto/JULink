use std::time::Duration;

use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::{
        HeaderMap, HeaderValue, StatusCode,
        header::{CONTENT_TYPE, COOKIE, ORIGIN, SET_COOKIE, USER_AGENT},
    },
    response::{IntoResponse, Response},
    routing::{get, post, put},
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

use julink_common::{AppError, auth::CurrentUser};
use julink_proto::UserSummary;

use crate::{
    config::IdentityConfig,
    otp::{self, OtpHasher},
    password, refresh,
    state::IdentityState,
};

const USER_COLUMNS: &str = "id, username, display_name, email, password_hash, \
                            email_verified_at, avatar_url, banner_url, bio, \
                            college, theme_preference, first_login, created_at";

#[derive(Debug, sqlx::FromRow)]
struct UserRow {
    id: Uuid,
    username: String,
    display_name: String,
    email: String,
    password_hash: String,
    email_verified_at: Option<DateTime<Utc>>,
    avatar_url: Option<String>,
    banner_url: Option<String>,
    bio: Option<String>,
    college: Option<String>,
    theme_preference: String,
    first_login: bool,
    created_at: DateTime<Utc>,
}

#[derive(Debug, sqlx::FromRow)]
struct DevUser {
    id: Uuid,
    username: String,
}

#[derive(Debug, sqlx::FromRow)]
struct OtpRow {
    id: Uuid,
    code_hash: String,
    attempts: i32,
    expires_at: DateTime<Utc>,
}

#[derive(Debug, sqlx::FromRow)]
struct RefreshRow {
    id: Uuid,
    user_id: Uuid,
    family_id: Uuid,
    expires_at: DateTime<Utc>,
    revoked_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct UserProfile {
    pub id: Uuid,
    pub username: String,
    pub display_name: String,
    pub email: String,
    pub email_verified: bool,
    pub avatar_url: Option<String>,
    pub banner_url: Option<String>,
    pub bio: Option<String>,
    pub college: Option<String>,
    pub theme_preference: String,
    pub first_login: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct PublicProfile {
    pub id: Uuid,
    pub username: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub banner_url: Option<String>,
    pub bio: Option<String>,
    pub college: Option<String>,
    pub theme_preference: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct OwnUsername {
    pub username: String,
}

impl From<UserRow> for UserProfile {
    fn from(user: UserRow) -> Self {
        Self {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            email: user.email,
            email_verified: user.email_verified_at.is_some(),
            avatar_url: user.avatar_url,
            banner_url: user.banner_url,
            bio: user.bio,
            college: user.college,
            theme_preference: user.theme_preference,
            first_login: user.first_login,
            created_at: user.created_at,
        }
    }
}

impl From<UserRow> for PublicProfile {
    fn from(user: UserRow) -> Self {
        Self {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
            banner_url: user.banner_url,
            bio: user.bio,
            college: user.college,
            theme_preference: user.theme_preference,
            created_at: user.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub token_type: &'static str,
    pub expires_in: u64,
    pub user: UserProfile,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub display_name: Option<String>,
    pub college: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub banner_url: Option<String>,
    pub college: Option<String>,
    pub theme_preference: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct VerifyOtpRequest {
    pub email: String,
    pub code: String,
    pub purpose: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub identifier: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct ForgotPasswordRequest {
    pub email: String,
}

#[derive(Debug, Deserialize)]
pub struct ResendOtpRequest {
    pub email: String,
    pub purpose: String,
}

#[derive(Debug, Deserialize)]
pub struct ResetPasswordRequest {
    pub email: String,
    pub code: String,
    pub new_password: String,
}

#[derive(Debug, Deserialize)]
pub struct DevTokenRequest {
    pub username: String,
}

#[derive(Debug, Serialize)]
pub struct DevTokenResponse {
    pub access_token: String,
    pub token_type: &'static str,
    pub expires_in: u64,
    pub user_id: Uuid,
    pub username: String,
}

#[derive(Debug, Serialize)]
pub struct OtpSentResponse {
    pub status: &'static str,
    pub email: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dev_code: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SimpleResponse {
    pub status: &'static str,
    pub message: &'static str,
}

#[derive(Debug, Serialize)]
pub struct InternalUser {
    pub user_id: Uuid,
    pub username: String,
}

#[derive(Debug, Deserialize)]
pub struct InternalUsersQuery {
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct BatchUsersRequest {
    pub usernames: Vec<String>,
}

#[derive(Debug, sqlx::FromRow)]
struct InternalUserSummaryRow {
    id: Uuid,
    username: String,
    display_name: String,
    avatar_url: Option<String>,
}

impl From<InternalUserSummaryRow> for UserSummary {
    fn from(row: InternalUserSummaryRow) -> Self {
        Self {
            id: row.id,
            username: row.username,
            display_name: row.display_name,
            avatar_url: row.avatar_url,
        }
    }
}

pub fn router(state: IdentityState) -> Router {
    Router::new()
        .route("/api/v1/auth/register", post(register))
        .route("/api/v1/auth/verify-otp", post(verify_otp))
        .route("/api/v1/auth/otp/resend", post(resend_otp))
        .route("/api/v1/auth/login", post(login))
        .route("/api/v1/auth/refresh", post(refresh_session))
        .route("/api/v1/auth/logout", post(logout))
        .route("/api/v1/auth/logout-all", post(logout_all))
        .route("/api/v1/auth/me", get(me).delete(delete_me))
        .route("/api/v1/profile/me", get(profile_me).patch(update_profile))
        .route("/api/v1/profile/ownusername", get(own_username))
        .route("/api/v1/profile/setup", put(setup_profile))
        .route("/api/v1/profile/{username}", get(public_profile))
        .route("/api/v1/auth/password/forgot", post(forgot_password))
        .route("/api/v1/auth/password/reset", post(reset_password))
        .route("/api/v1/auth/dev-token", post(dev_token))
        .route("/internal/jwt/public-key", get(public_key))
        .route("/internal/jwks.json", get(jwks))
        .route(
            "/internal/users/by-username/{username}",
            get(internal_user_by_username),
        )
        .route("/internal/users", get(internal_users))
        .route("/internal/users/batch", post(internal_users_batch))
        .route("/.well-known/jwks.json", get(jwks))
        .with_state(state)
}

async fn register(
    State(state): State<IdentityState>,
    Json(request): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<OtpSentResponse>), AppError> {
    let username = request.username.trim();
    validate_username(username)?;

    let email = normalize_email(&request.email);
    validate_email(&email)?;
    validate_password(&request.password)?;

    let display_name = request
        .display_name
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or(username)
        .to_string();
    validate_display_name(&display_name)?;
    let college = request
        .college
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);
    if let Some(college) = &college {
        if college.chars().count() > 100 {
            return Err(AppError::BadRequest(
                "college must be at most 100 characters".to_string(),
            ));
        }
    }

    let password_hash = password::hash_password(&request.password)?;

    let mut tx = state.db.begin().await?;
    let insert = sqlx::query_scalar::<_, Uuid>(
        r#"
        INSERT INTO users (username, email, display_name, password_hash, college)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        "#,
    )
    .bind(username)
    .bind(&email)
    .bind(&display_name)
    .bind(&password_hash)
    .bind(&college)
    .fetch_one(&mut *tx)
    .await;

    if let Err(error) = insert {
        if is_unique_violation(&error) {
            return Err(AppError::Conflict(
                "that username or email is already registered".to_string(),
            ));
        }
        return Err(error.into());
    }

    let code = create_otp(&mut tx, &state, &email, otp::PURPOSE_REGISTER).await?;
    tx.commit().await?;

    state
        .email
        .send_otp(&email, &code, otp::PURPOSE_REGISTER)
        .await
        .map_err(|error| AppError::Email(format!("{error:#}")))?;

    Ok((
        StatusCode::ACCEPTED,
        Json(OtpSentResponse {
            status: "otp_sent",
            email,
            dev_code: state.config.dev_otp.then_some(code),
        }),
    ))
}

async fn verify_otp(
    State(state): State<IdentityState>,
    Json(request): Json<VerifyOtpRequest>,
) -> Result<Json<SimpleResponse>, AppError> {
    let email = normalize_email(&request.email);
    validate_email(&email)?;

    let purpose = otp::validate_purpose(&request.purpose)
        .map_err(|error| AppError::BadRequest(error.to_string()))?;
    if purpose != otp::PURPOSE_REGISTER {
        return Err(AppError::BadRequest(
            "use the password reset endpoint to redeem this code".to_string(),
        ));
    }

    let code = validate_code(&request.code)?;
    verify_otp_code(&state.db, &state.otp, &state.config, &email, purpose, code).await?;

    let result = sqlx::query(
        r#"
        UPDATE users
        SET email_verified_at = COALESCE(email_verified_at, now()), updated_at = now()
        WHERE email = $1
        "#,
    )
    .bind(&email)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }

    Ok(Json(SimpleResponse {
        status: "verified",
        message: "email verified",
    }))
}

async fn resend_otp(
    State(state): State<IdentityState>,
    Json(request): Json<ResendOtpRequest>,
) -> Result<(StatusCode, Json<OtpSentResponse>), AppError> {
    let email = normalize_email(&request.email);
    validate_email(&email)?;

    let purpose = otp::validate_purpose(&request.purpose)
        .map_err(|error| AppError::BadRequest(error.to_string()))?;
    if purpose != otp::PURPOSE_REGISTER {
        return Err(AppError::BadRequest(
            "use the password reset endpoint to request that code".to_string(),
        ));
    }

    // Always return 202: do not reveal whether the address exists or is
    // already verified.
    let verified = sqlx::query_scalar::<_, Option<DateTime<Utc>>>(
        "SELECT email_verified_at FROM users WHERE email = $1",
    )
    .bind(&email)
    .fetch_optional(&state.db)
    .await?;

    let Some(verified) = verified else {
        return Ok((
            StatusCode::ACCEPTED,
            Json(OtpSentResponse {
                status: "otp_sent",
                email,
                dev_code: None,
            }),
        ));
    };

    if verified.is_some() {
        return Ok((
            StatusCode::ACCEPTED,
            Json(OtpSentResponse {
                status: "otp_sent",
                email,
                dev_code: None,
            }),
        ));
    }

    let mut tx = state.db.begin().await?;
    let code = create_otp(&mut tx, &state, &email, purpose).await?;
    tx.commit().await?;

    state
        .email
        .send_otp(&email, &code, purpose)
        .await
        .map_err(|error| AppError::Email(format!("{error:#}")))?;

    Ok((
        StatusCode::ACCEPTED,
        Json(OtpSentResponse {
            status: "otp_sent",
            email,
            dev_code: state.config.dev_otp.then_some(code),
        }),
    ))
}

async fn login(
    State(state): State<IdentityState>,
    headers: HeaderMap,
    Json(request): Json<LoginRequest>,
) -> Result<Response, AppError> {
    let identifier = request.identifier.trim();
    if identifier.is_empty() || request.password.is_empty() {
        return Err(AppError::BadRequest(
            "identifier and password are required".to_string(),
        ));
    }

    let user = sqlx::query_as::<_, UserRow>(&format!(
        "SELECT {USER_COLUMNS} FROM users WHERE email = $1 OR username = $1"
    ))
    .bind(identifier)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::Unauthorized)?;

    if !password::verify_password(&request.password, &user.password_hash) {
        return Err(AppError::Unauthorized);
    }

    if user.email_verified_at.is_none() {
        return Err(AppError::EmailNotVerified);
    }

    let user_agent = user_agent(&headers);
    let refresh_token = insert_refresh_token_pool(
        &state.db,
        &state.config,
        user.id,
        Uuid::now_v7(),
        user_agent.as_deref(),
    )
    .await?;
    let access_token = state
        .keys
        .issue(user.id, &user.username, state.config.access_ttl)?;

    let _ = sqlx::query("UPDATE users SET last_login_at = now() WHERE id = $1")
        .bind(user.id)
        .execute(&state.db)
        .await;

    let mut response = Json(AuthResponse {
        access_token,
        token_type: "Bearer",
        expires_in: state.config.access_ttl.as_secs(),
        user: user.into(),
    })
    .into_response();

    set_refresh_cookie(&mut response, &state.config, &refresh_token)?;
    Ok(response)
}

async fn refresh_session(
    State(state): State<IdentityState>,
    headers: HeaderMap,
) -> Result<Response, AppError> {
    check_origin(&headers, &state.config)?;

    let presented = refresh_token_from_cookie(&headers, &state.config.cookie_name)
        .ok_or(AppError::Unauthorized)?;
    let token_hash = refresh::hash(&presented);

    let mut tx = state.db.begin().await?;
    let stored = sqlx::query_as::<_, RefreshRow>(
        r#"
        SELECT id, user_id, family_id, expires_at, revoked_at
        FROM refresh_tokens
        WHERE token_hash = $1
        FOR UPDATE
        "#,
    )
    .bind(&token_hash)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or(AppError::Unauthorized)?;

    if stored.revoked_at.is_some() {
        // A revoked token was replayed. Assume theft and revoke the family.
        sqlx::query(
            r#"
            UPDATE refresh_tokens
            SET revoked_at = now(), revoked_reason = 'reuse_detected'
            WHERE family_id = $1 AND revoked_at IS NULL
            "#,
        )
        .bind(stored.family_id)
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;
        return Err(AppError::Unauthorized);
    }

    if stored.expires_at <= Utc::now() {
        return Err(AppError::Unauthorized);
    }

    sqlx::query(
        r#"
        UPDATE refresh_tokens
        SET revoked_at = now(), revoked_reason = 'rotated', last_used_at = now()
        WHERE id = $1
        "#,
    )
    .bind(stored.id)
    .execute(&mut *tx)
    .await?;

    let user_agent = user_agent(&headers);
    let new_token = insert_refresh_token_tx(
        &mut tx,
        &state.config,
        stored.user_id,
        stored.family_id,
        user_agent.as_deref(),
    )
    .await?;

    let user =
        sqlx::query_as::<_, UserRow>(&format!("SELECT {USER_COLUMNS} FROM users WHERE id = $1"))
            .bind(stored.user_id)
            .fetch_one(&mut *tx)
            .await?;

    tx.commit().await?;

    let access_token = state
        .keys
        .issue(user.id, &user.username, state.config.access_ttl)?;

    let mut response = Json(AuthResponse {
        access_token,
        token_type: "Bearer",
        expires_in: state.config.access_ttl.as_secs(),
        user: user.into(),
    })
    .into_response();

    set_refresh_cookie(&mut response, &state.config, &new_token)?;
    Ok(response)
}

async fn logout(
    State(state): State<IdentityState>,
    headers: HeaderMap,
) -> Result<Response, AppError> {
    check_origin(&headers, &state.config)?;

    if let Some(token) = refresh_token_from_cookie(&headers, &state.config.cookie_name) {
        let token_hash = refresh::hash(&token);
        let _ = sqlx::query(
            r#"
            UPDATE refresh_tokens
            SET revoked_at = now(), revoked_reason = 'logout'
            WHERE family_id = (
                SELECT family_id FROM refresh_tokens WHERE token_hash = $1
            ) AND revoked_at IS NULL
            "#,
        )
        .bind(token_hash)
        .execute(&state.db)
        .await;
    }

    let mut response = StatusCode::NO_CONTENT.into_response();
    clear_refresh_cookie(&mut response, &state.config)?;
    Ok(response)
}

async fn logout_all(
    State(state): State<IdentityState>,
    user: CurrentUser,
    headers: HeaderMap,
) -> Result<Response, AppError> {
    check_origin(&headers, &state.config)?;

    sqlx::query(
        r#"
        UPDATE refresh_tokens
        SET revoked_at = now(), revoked_reason = 'logout_all'
        WHERE user_id = $1 AND revoked_at IS NULL
        "#,
    )
    .bind(user.user_id)
    .execute(&state.db)
    .await?;

    let mut response = StatusCode::NO_CONTENT.into_response();
    clear_refresh_cookie(&mut response, &state.config)?;
    Ok(response)
}

async fn me(
    State(state): State<IdentityState>,
    user: CurrentUser,
) -> Result<Json<UserProfile>, AppError> {
    Ok(Json(load_user(&state.db, user.user_id).await?))
}

async fn profile_me(
    State(state): State<IdentityState>,
    user: CurrentUser,
) -> Result<Json<UserProfile>, AppError> {
    Ok(Json(load_user(&state.db, user.user_id).await?))
}

async fn public_profile(
    State(state): State<IdentityState>,
    Path(username): Path<String>,
) -> Result<Json<PublicProfile>, AppError> {
    let row = sqlx::query_as::<_, UserRow>(&format!(
        "SELECT {USER_COLUMNS} FROM users WHERE username = $1"
    ))
    .bind(username.trim())
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(row.into()))
}

async fn own_username(
    State(state): State<IdentityState>,
    user: CurrentUser,
) -> Result<Json<OwnUsername>, AppError> {
    let row = load_user(&state.db, user.user_id).await?;
    Ok(Json(OwnUsername {
        username: row.username,
    }))
}

async fn update_profile(
    State(state): State<IdentityState>,
    user: CurrentUser,
    Json(request): Json<UpdateProfileRequest>,
) -> Result<Json<UserProfile>, AppError> {
    validate_profile_update(&request)?;

    let row = sqlx::query_as::<_, UserRow>(&format!(
        r#"
        UPDATE users SET
            display_name = COALESCE($1, display_name),
            bio = COALESCE($2, bio),
            avatar_url = COALESCE($3, avatar_url),
            banner_url = COALESCE($4, banner_url),
            college = COALESCE($5, college),
            theme_preference = COALESCE($6, theme_preference),
            updated_at = now()
        WHERE id = $7
        RETURNING {USER_COLUMNS}
        "#
    ))
    .bind(request.display_name.as_deref().map(str::trim))
    .bind(request.bio.as_deref())
    .bind(request.avatar_url.as_deref())
    .bind(request.banner_url.as_deref())
    .bind(request.college.as_deref().map(str::trim))
    .bind(request.theme_preference.as_deref())
    .bind(user.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(row.into()))
}

async fn setup_profile(
    State(state): State<IdentityState>,
    user: CurrentUser,
    Json(request): Json<UpdateProfileRequest>,
) -> Result<Json<UserProfile>, AppError> {
    validate_profile_update(&request)?;

    let row = sqlx::query_as::<_, UserRow>(&format!(
        r#"
        UPDATE users SET
            display_name = COALESCE($1, display_name),
            bio = COALESCE($2, bio),
            avatar_url = COALESCE($3, avatar_url),
            banner_url = COALESCE($4, banner_url),
            college = COALESCE($5, college),
            theme_preference = COALESCE($6, theme_preference),
            first_login = false,
            updated_at = now()
        WHERE id = $7
        RETURNING {USER_COLUMNS}
        "#
    ))
    .bind(request.display_name.as_deref().map(str::trim))
    .bind(request.bio.as_deref())
    .bind(request.avatar_url.as_deref())
    .bind(request.banner_url.as_deref())
    .bind(request.college.as_deref().map(str::trim))
    .bind(request.theme_preference.as_deref())
    .bind(user.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(row.into()))
}

async fn delete_me(
    State(state): State<IdentityState>,
    user: CurrentUser,
) -> Result<StatusCode, AppError> {
    let email = sqlx::query_scalar::<_, String>("SELECT email::text FROM users WHERE id = $1")
        .bind(user.user_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::NotFound)?;

    let mut tx = state.db.begin().await?;
    sqlx::query("DELETE FROM refresh_tokens WHERE user_id = $1")
        .bind(user.user_id)
        .execute(&mut *tx)
        .await?;
    sqlx::query("DELETE FROM otp_codes WHERE email = $1")
        .bind(&email)
        .execute(&mut *tx)
        .await?;
    sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user.user_id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn load_user(pool: &PgPool, user_id: Uuid) -> Result<UserProfile, AppError> {
    let row =
        sqlx::query_as::<_, UserRow>(&format!("SELECT {USER_COLUMNS} FROM users WHERE id = $1"))
            .bind(user_id)
            .fetch_optional(pool)
            .await?
            .ok_or(AppError::NotFound)?;

    Ok(row.into())
}

async fn forgot_password(
    State(state): State<IdentityState>,
    Json(request): Json<ForgotPasswordRequest>,
) -> Result<(StatusCode, Json<OtpSentResponse>), AppError> {
    let email = normalize_email(&request.email);
    validate_email(&email)?;

    let exists =
        sqlx::query_scalar::<_, bool>("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)")
            .bind(&email)
            .fetch_one(&state.db)
            .await?;

    if !exists {
        // Do not reveal whether the address is registered.
        return Ok((
            StatusCode::ACCEPTED,
            Json(OtpSentResponse {
                status: "otp_sent",
                email,
                dev_code: None,
            }),
        ));
    }

    let mut tx = state.db.begin().await?;
    let code = create_otp(&mut tx, &state, &email, otp::PURPOSE_PASSWORD_RESET).await?;
    tx.commit().await?;

    state
        .email
        .send_otp(&email, &code, otp::PURPOSE_PASSWORD_RESET)
        .await
        .map_err(|error| AppError::Email(format!("{error:#}")))?;

    Ok((
        StatusCode::ACCEPTED,
        Json(OtpSentResponse {
            status: "otp_sent",
            email,
            dev_code: state.config.dev_otp.then_some(code),
        }),
    ))
}

async fn reset_password(
    State(state): State<IdentityState>,
    Json(request): Json<ResetPasswordRequest>,
) -> Result<Json<SimpleResponse>, AppError> {
    let email = normalize_email(&request.email);
    validate_email(&email)?;
    validate_password(&request.new_password)?;
    let code = validate_code(&request.code)?;

    verify_otp_code(
        &state.db,
        &state.otp,
        &state.config,
        &email,
        otp::PURPOSE_PASSWORD_RESET,
        code,
    )
    .await?;

    let password_hash = password::hash_password(&request.new_password)?;
    let mut tx = state.db.begin().await?;

    let updated = sqlx::query(
        r#"
        UPDATE users
        SET password_hash = $1, password_updated_at = now(), updated_at = now()
        WHERE email = $2
        "#,
    )
    .bind(&password_hash)
    .bind(&email)
    .execute(&mut *tx)
    .await?;

    if updated.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }

    sqlx::query(
        r#"
        UPDATE refresh_tokens
        SET revoked_at = now(), revoked_reason = 'password_reset'
        WHERE user_id = (SELECT id FROM users WHERE email = $1)
          AND revoked_at IS NULL
        "#,
    )
    .bind(&email)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(Json(SimpleResponse {
        status: "password_reset",
        message: "password updated; sign in again",
    }))
}

async fn dev_token(
    State(state): State<IdentityState>,
    Json(request): Json<DevTokenRequest>,
) -> Result<Json<DevTokenResponse>, AppError> {
    if !state.config.base.dev_auth {
        return Err(AppError::NotFound);
    }

    let username = request.username.trim();
    validate_username(username)?;
    let email = format!("{}@dev.julink.local", username.to_ascii_lowercase());

    let user = sqlx::query_as::<_, DevUser>(
        r#"
        INSERT INTO users (username, email, display_name, password_hash, email_verified_at)
        VALUES ($1, $2, $1, '!dev', now())
        ON CONFLICT (username) DO UPDATE SET updated_at = now()
        RETURNING id, username
        "#,
    )
    .bind(username)
    .bind(&email)
    .fetch_one(&state.db)
    .await?;

    let access_token = state
        .keys
        .issue(user.id, &user.username, state.config.access_ttl)?;

    Ok(Json(DevTokenResponse {
        access_token,
        token_type: "Bearer",
        expires_in: state.config.access_ttl.as_secs(),
        user_id: user.id,
        username: user.username,
    }))
}

async fn public_key(State(state): State<IdentityState>) -> impl IntoResponse {
    (
        StatusCode::OK,
        [(CONTENT_TYPE, "application/x-pem-file")],
        state.keys.public_pem().to_string(),
    )
}

async fn jwks(State(state): State<IdentityState>) -> Json<Value> {
    Json(state.keys.jwks())
}

async fn internal_user_by_username(
    State(state): State<IdentityState>,
    Path(username): Path<String>,
) -> Result<Json<InternalUser>, AppError> {
    let user = sqlx::query_as::<_, DevUser>("SELECT id, username FROM users WHERE username = $1")
        .bind(username.trim())
        .fetch_optional(&state.db)
        .await?
        .ok_or(AppError::NotFound)?;

    Ok(Json(InternalUser {
        user_id: user.id,
        username: user.username,
    }))
}

async fn internal_users(
    State(state): State<IdentityState>,
    Query(query): Query<InternalUsersQuery>,
) -> Result<Json<Vec<UserSummary>>, AppError> {
    let limit = i64::from(query.limit.unwrap_or(500).clamp(1, 1000));
    let offset = i64::from(query.offset.unwrap_or(0));

    let rows = sqlx::query_as::<_, InternalUserSummaryRow>(
        r#"
        SELECT id, username, display_name, avatar_url
        FROM users
        ORDER BY created_at, id
        LIMIT $1 OFFSET $2
        "#,
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(rows.into_iter().map(Into::into).collect()))
}

async fn internal_users_batch(
    State(state): State<IdentityState>,
    Json(request): Json<BatchUsersRequest>,
) -> Result<Json<Vec<UserSummary>>, AppError> {
    if request.usernames.is_empty() {
        return Ok(Json(Vec::new()));
    }

    let usernames: Vec<String> = request
        .usernames
        .iter()
        .map(|username| username.trim().to_lowercase())
        .filter(|username| !username.is_empty())
        .collect();

    let rows = sqlx::query_as::<_, InternalUserSummaryRow>(
        r#"
        SELECT id, username, display_name, avatar_url
        FROM users
        WHERE lower(username::text) = ANY($1)
        "#,
    )
    .bind(&usernames)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(rows.into_iter().map(Into::into).collect()))
}

async fn create_otp(
    tx: &mut Transaction<'_, Postgres>,
    state: &IdentityState,
    email: &str,
    purpose: &str,
) -> Result<String, AppError> {
    let latest: Option<DateTime<Utc>> = sqlx::query_scalar(
        r#"
        SELECT created_at
        FROM otp_codes
        WHERE email = $1 AND purpose = $2
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(email)
    .bind(purpose)
    .fetch_optional(&mut **tx)
    .await?;

    if let Some(created_at) = latest {
        let cooldown = chrono_duration(state.config.otp_resend_cooldown)?;
        if Utc::now().signed_duration_since(created_at) < cooldown {
            return Err(AppError::TooManyRequests(
                "wait before requesting another code".to_string(),
            ));
        }
    }

    sqlx::query(
        r#"
        UPDATE otp_codes
        SET consumed_at = now()
        WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL
        "#,
    )
    .bind(email)
    .bind(purpose)
    .execute(&mut **tx)
    .await?;

    let code = otp::generate_code();
    let code_hash = state.otp.hash(email, purpose, &code);
    let expires_at = Utc::now() + chrono_duration(state.config.otp_ttl)?;

    sqlx::query(
        r#"
        INSERT INTO otp_codes (email, purpose, code_hash, expires_at)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(email)
    .bind(purpose)
    .bind(code_hash)
    .bind(expires_at)
    .execute(&mut **tx)
    .await?;

    Ok(code)
}

async fn verify_otp_code(
    pool: &PgPool,
    hasher: &OtpHasher,
    config: &IdentityConfig,
    email: &str,
    purpose: &str,
    code: &str,
) -> Result<(), AppError> {
    let row = sqlx::query_as::<_, OtpRow>(
        r#"
        SELECT id, code_hash, attempts, expires_at
        FROM otp_codes
        WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(email)
    .bind(purpose)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::BadRequest("invalid or expired code".to_string()))?;

    if row.expires_at <= Utc::now() {
        return Err(AppError::BadRequest("invalid or expired code".to_string()));
    }

    if row.attempts >= config.otp_max_attempts {
        return Err(AppError::TooManyRequests(
            "too many attempts; request a new code".to_string(),
        ));
    }

    if !hasher.verify(email, purpose, code, &row.code_hash) {
        sqlx::query("UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1")
            .bind(row.id)
            .execute(pool)
            .await?;
        return Err(AppError::BadRequest("invalid or expired code".to_string()));
    }

    let consumed = sqlx::query(
        "UPDATE otp_codes SET consumed_at = now() WHERE id = $1 AND consumed_at IS NULL",
    )
    .bind(row.id)
    .execute(pool)
    .await?;

    if consumed.rows_affected() == 0 {
        return Err(AppError::BadRequest("invalid or expired code".to_string()));
    }

    Ok(())
}

async fn insert_refresh_token_pool(
    pool: &PgPool,
    config: &IdentityConfig,
    user_id: Uuid,
    family_id: Uuid,
    user_agent: Option<&str>,
) -> Result<String, AppError> {
    let token = refresh::generate();
    let token_hash = refresh::hash(&token);
    let expires_at = Utc::now() + chrono_duration(config.refresh_ttl)?;

    sqlx::query(
        r#"
        INSERT INTO refresh_tokens (user_id, token_hash, family_id, user_agent, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        "#,
    )
    .bind(user_id)
    .bind(token_hash)
    .bind(family_id)
    .bind(user_agent)
    .bind(expires_at)
    .execute(pool)
    .await?;

    Ok(token)
}

async fn insert_refresh_token_tx(
    tx: &mut Transaction<'_, Postgres>,
    config: &IdentityConfig,
    user_id: Uuid,
    family_id: Uuid,
    user_agent: Option<&str>,
) -> Result<String, AppError> {
    let token = refresh::generate();
    let token_hash = refresh::hash(&token);
    let expires_at = Utc::now() + chrono_duration(config.refresh_ttl)?;

    sqlx::query(
        r#"
        INSERT INTO refresh_tokens (user_id, token_hash, family_id, user_agent, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        "#,
    )
    .bind(user_id)
    .bind(token_hash)
    .bind(family_id)
    .bind(user_agent)
    .bind(expires_at)
    .execute(&mut **tx)
    .await?;

    Ok(token)
}

fn set_refresh_cookie(
    response: &mut Response,
    config: &IdentityConfig,
    token: &str,
) -> Result<(), AppError> {
    let cookie = format!(
        "{}={}; HttpOnly; Path={}; Max-Age={}; SameSite=Lax{}",
        config.cookie_name,
        token,
        config.cookie_path,
        config.refresh_ttl.as_secs(),
        if config.cookie_secure { "; Secure" } else { "" }
    );

    response.headers_mut().append(
        SET_COOKIE,
        HeaderValue::from_str(&cookie).map_err(|error| AppError::Internal(error.into()))?,
    );
    Ok(())
}

fn clear_refresh_cookie(response: &mut Response, config: &IdentityConfig) -> Result<(), AppError> {
    let cookie = format!(
        "{}=; HttpOnly; Path={}; Max-Age=0; SameSite=Lax{}",
        config.cookie_name,
        config.cookie_path,
        if config.cookie_secure { "; Secure" } else { "" }
    );

    response.headers_mut().append(
        SET_COOKIE,
        HeaderValue::from_str(&cookie).map_err(|error| AppError::Internal(error.into()))?,
    );
    Ok(())
}

fn refresh_token_from_cookie(headers: &HeaderMap, name: &str) -> Option<String> {
    headers
        .get_all(COOKIE)
        .iter()
        .filter_map(|value| value.to_str().ok())
        .flat_map(|value| value.split(';'))
        .find_map(|part| {
            let (key, value) = part.trim().split_once('=')?;
            (key == name).then(|| value.to_string())
        })
}

fn check_origin(headers: &HeaderMap, config: &IdentityConfig) -> Result<(), AppError> {
    let Some(origin) = headers.get(ORIGIN).and_then(|value| value.to_str().ok()) else {
        return Ok(());
    };

    if config
        .base
        .cors_origins
        .iter()
        .any(|allowed| allowed.as_bytes() == origin.as_bytes())
    {
        Ok(())
    } else {
        Err(AppError::Forbidden)
    }
}

fn user_agent(headers: &HeaderMap) -> Option<String> {
    headers
        .get(USER_AGENT)
        .and_then(|value| value.to_str().ok())
        .map(|value| value.chars().take(256).collect())
}

fn normalize_email(email: &str) -> String {
    email.trim().to_ascii_lowercase()
}

fn validate_username(username: &str) -> Result<(), AppError> {
    if !(3..=32).contains(&username.len()) {
        return Err(AppError::BadRequest(
            "username must be 3-32 characters".to_string(),
        ));
    }

    if !username
        .chars()
        .all(|character| character.is_ascii_alphanumeric() || matches!(character, '_' | '.'))
    {
        return Err(AppError::BadRequest(
            "username may contain only letters, numbers, `_` and `.`".to_string(),
        ));
    }

    Ok(())
}

fn validate_email(email: &str) -> Result<(), AppError> {
    let valid = (5..=254).contains(&email.len())
        && email.split_once('@').is_some_and(|(local, domain)| {
            !local.is_empty()
                && domain.contains('.')
                && !domain.starts_with('.')
                && !domain.ends_with('.')
        });

    if valid {
        Ok(())
    } else {
        Err(AppError::BadRequest("invalid email address".to_string()))
    }
}

fn validate_password(password: &str) -> Result<(), AppError> {
    if (8..=128).contains(&password.len()) {
        Ok(())
    } else {
        Err(AppError::BadRequest(
            "password must be 8-128 characters".to_string(),
        ))
    }
}

fn validate_display_name(display_name: &str) -> Result<(), AppError> {
    if (1..=80).contains(&display_name.chars().count()) {
        Ok(())
    } else {
        Err(AppError::BadRequest(
            "display name must be 1-80 characters".to_string(),
        ))
    }
}

fn validate_profile_update(request: &UpdateProfileRequest) -> Result<(), AppError> {
    if let Some(display_name) = &request.display_name {
        validate_display_name(display_name.trim())?;
    }
    if let Some(bio) = &request.bio {
        if bio.chars().count() > 500 {
            return Err(AppError::BadRequest(
                "bio must be at most 500 characters".to_string(),
            ));
        }
    }
    if let Some(college) = &request.college {
        if college.chars().count() > 100 {
            return Err(AppError::BadRequest(
                "college must be at most 100 characters".to_string(),
            ));
        }
    }
    if let Some(theme) = &request.theme_preference {
        if !matches!(theme.as_str(), "system" | "light" | "dark") {
            return Err(AppError::BadRequest(
                "theme must be `system`, `light` or `dark`".to_string(),
            ));
        }
    }
    Ok(())
}

fn validate_code(code: &str) -> Result<&str, AppError> {
    let code = code.trim();
    if code.len() == 6 && code.chars().all(|character| character.is_ascii_digit()) {
        Ok(code)
    } else {
        Err(AppError::BadRequest(
            "verification code must be 6 digits".to_string(),
        ))
    }
}

fn chrono_duration(duration: Duration) -> Result<chrono::Duration, AppError> {
    chrono::Duration::from_std(duration).map_err(|error| AppError::Internal(error.into()))
}

fn is_unique_violation(error: &sqlx::Error) -> bool {
    error
        .as_database_error()
        .and_then(|database_error| database_error.code())
        .is_some_and(|code| code.as_ref() == "23505")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_usernames() {
        assert!(validate_username("student_1").is_ok());
        assert!(validate_username("ab").is_err());
        assert!(validate_username("bad name").is_err());
        assert!(validate_username("bad/name").is_err());
    }

    #[test]
    fn validates_emails() {
        assert!(validate_email("student@example.com").is_ok());
        assert!(validate_email("no-at-sign").is_err());
        assert!(validate_email("@example.com").is_err());
        assert!(validate_email("student@example").is_err());
    }

    #[test]
    fn validates_passwords_and_codes() {
        assert!(validate_password("long enough").is_ok());
        assert!(validate_password("short").is_err());
        assert!(validate_code("123456").is_ok());
        assert!(validate_code("12345").is_err());
        assert!(validate_code("abcdef").is_err());
    }

    #[test]
    fn reads_the_refresh_cookie() {
        let mut headers = HeaderMap::new();
        headers.insert(
            COOKIE,
            HeaderValue::from_static("theme=dark; julink_refresh=abc123; other=value"),
        );
        assert_eq!(
            refresh_token_from_cookie(&headers, "julink_refresh").as_deref(),
            Some("abc123")
        );
        assert_eq!(refresh_token_from_cookie(&headers, "missing"), None);
    }
}
