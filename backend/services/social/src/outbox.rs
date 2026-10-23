use std::time::Duration;

use async_nats::Client;
use serde_json::Value;
use sqlx::{PgPool, types::Json};
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
struct OutboxRow {
    id: Uuid,
    event_type: String,
    payload: Json<Value>,
}

/// Connects to NATS and drains the outbox forever. Connection failures are
/// retried; the outbox keeps events durable in Postgres in the meantime.
pub async fn run(db: PgPool, nats_url: String) {
    loop {
        match async_nats::connect(&nats_url).await {
            Ok(client) => {
                tracing::info!(%nats_url, "outbox relay connected to NATS");
                relay_loop(&db, &client).await;
            }
            Err(error) => {
                tracing::warn!(%error, %nats_url, "could not connect to NATS; retrying");
                tokio::time::sleep(Duration::from_secs(5)).await;
            }
        }
    }
}

async fn relay_loop(db: &PgPool, client: &Client) {
    loop {
        match publish_batch(db, client).await {
            Ok(0) => tokio::time::sleep(Duration::from_secs(1)).await,
            Ok(_) => {}
            Err(error) => {
                tracing::warn!(%error, "outbox publish failed");
                tokio::time::sleep(Duration::from_secs(2)).await;
            }
        }
    }
}

async fn publish_batch(db: &PgPool, client: &Client) -> anyhow::Result<usize> {
    let rows = sqlx::query_as::<_, OutboxRow>(
        r#"
        SELECT id, event_type, payload
        FROM outbox
        WHERE published_at IS NULL
        ORDER BY created_at
        LIMIT 100
        "#,
    )
    .fetch_all(db)
    .await?;

    for row in &rows {
        let subject = format!("social.{}.v1", row.event_type);
        if let Err(error) = client
            .publish(subject, row.payload.0.to_string().into())
            .await
        {
            sqlx::query("UPDATE outbox SET attempts = attempts + 1, last_error = $2 WHERE id = $1")
                .bind(row.id)
                .bind(error.to_string())
                .execute(db)
                .await?;
            return Err(error.into());
        }

        sqlx::query(
            "UPDATE outbox SET published_at = now(), attempts = attempts + 1 WHERE id = $1",
        )
        .bind(row.id)
        .execute(db)
        .await?;
    }

    Ok(rows.len())
}
