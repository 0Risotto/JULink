use julink_proto::Page;
use neo4rs::Graph;
use serde::Serialize;
use uuid::Uuid;

use julink_common::AppError;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct FollowUser {
    pub user_id: Uuid,
    pub username: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct Suggestion {
    pub user_id: Uuid,
    pub username: String,
    pub mutuals: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct FollowingStatus {
    pub following: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct MutualStatus {
    pub mutual: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct BlockStatus {
    pub blocked: bool,
    pub blocked_by: bool,
}

macro_rules! collect_users {
    ($rows:expr) => {{
        let mut users = Vec::new();
        while let Some(row) = $rows.next().await.map_err(graph_error)? {
            let user_id: String = row.get("user_id").map_err(graph_error)?;
            let username: String = row.get("username").map_err(graph_error)?;
            if let Ok(user_id) = Uuid::parse_str(&user_id) {
                users.push(FollowUser { user_id, username });
            }
        }
        users
    }};
}

pub async fn ensure_schema(graph: &Graph) -> anyhow::Result<()> {
    graph
        .run(neo4rs::query(
            "CREATE CONSTRAINT user_id_unique IF NOT EXISTS \
             FOR (u:User) REQUIRE u.id IS UNIQUE",
        ))
        .await?;
    graph
        .run(neo4rs::query(
            "CREATE CONSTRAINT user_username_unique IF NOT EXISTS \
             FOR (u:User) REQUIRE u.username IS UNIQUE",
        ))
        .await?;
    Ok(())
}

pub async fn ensure_user(graph: &Graph, user_id: Uuid, username: &str) -> Result<(), AppError> {
    graph
        .run(
            neo4rs::query("MERGE (u:User {id: $id}) SET u.username = $username")
                .param("id", user_id.to_string())
                .param("username", username),
        )
        .await
        .map_err(graph_error)
}

pub async fn follow(graph: &Graph, follower: &str, followee: &str) -> Result<(), AppError> {
    graph
        .run(
            neo4rs::query(
                "MATCH (a:User {username: $follower}), (b:User {username: $followee}) \
                 MERGE (a)-[:FOLLOWS]->(b)",
            )
            .param("follower", follower)
            .param("followee", followee),
        )
        .await
        .map_err(graph_error)
}

pub async fn unfollow(graph: &Graph, follower: &str, followee: &str) -> Result<(), AppError> {
    graph
        .run(
            neo4rs::query(
                "MATCH (a:User {username: $follower})-[r:FOLLOWS]->(b:User {username: $followee}) \
                 DELETE r",
            )
            .param("follower", follower)
            .param("followee", followee),
        )
        .await
        .map_err(graph_error)
}

pub async fn block(graph: &Graph, blocker: &str, blocked: &str) -> Result<(), AppError> {
    graph
        .run(
            neo4rs::query(
                "MATCH (a:User {username: $blocker}), (b:User {username: $blocked}) \
                 MERGE (a)-[:BLOCKED]->(b)",
            )
            .param("blocker", blocker)
            .param("blocked", blocked),
        )
        .await
        .map_err(graph_error)?;

    // Blocking dissolves existing follows in both directions.
    graph
        .run(
            neo4rs::query(
                "MATCH (a:User {username: $blocker})-[r:FOLLOWS]->(b:User {username: $blocked}) \
                 DELETE r",
            )
            .param("blocker", blocker)
            .param("blocked", blocked),
        )
        .await
        .map_err(graph_error)?;
    graph
        .run(
            neo4rs::query(
                "MATCH (a:User {username: $blocked})-[r:FOLLOWS]->(b:User {username: $blocker}) \
                 DELETE r",
            )
            .param("blocker", blocker)
            .param("blocked", blocked),
        )
        .await
        .map_err(graph_error)
}

pub async fn unblock(graph: &Graph, blocker: &str, blocked: &str) -> Result<(), AppError> {
    graph
        .run(
            neo4rs::query(
                "MATCH (a:User {username: $blocker})-[r:BLOCKED]->(b:User {username: $blocked}) \
                 DELETE r",
            )
            .param("blocker", blocker)
            .param("blocked", blocked),
        )
        .await
        .map_err(graph_error)
}

pub async fn is_following(
    graph: &Graph,
    follower: &str,
    followee: &str,
) -> Result<FollowingStatus, AppError> {
    let mut rows = graph
        .execute(
            neo4rs::query(
                "MATCH (a:User {username: $follower}), (b:User {username: $followee}) \
                 RETURN EXISTS((a)-[:FOLLOWS]->(b)) \
                    AND NOT (a)-[:BLOCKED]->(b) \
                    AND NOT (b)-[:BLOCKED]->(a) AS following",
            )
            .param("follower", follower)
            .param("followee", followee),
        )
        .await
        .map_err(graph_error)?;

    let following = match rows.next().await.map_err(graph_error)? {
        Some(row) => row.get::<bool>("following").map_err(graph_error)?,
        None => false,
    };

    Ok(FollowingStatus { following })
}

pub async fn is_mutual(
    graph: &Graph,
    username1: &str,
    username2: &str,
) -> Result<MutualStatus, AppError> {
    let mut rows = graph
        .execute(
            neo4rs::query(
                "MATCH (a:User {username: $username1}), (b:User {username: $username2}) \
                 RETURN EXISTS((a)-[:FOLLOWS]->(b)) \
                    AND EXISTS((b)-[:FOLLOWS]->(a)) \
                    AND NOT (a)-[:BLOCKED]->(b) \
                    AND NOT (b)-[:BLOCKED]->(a) AS mutual",
            )
            .param("username1", username1)
            .param("username2", username2),
        )
        .await
        .map_err(graph_error)?;

    let mutual = match rows.next().await.map_err(graph_error)? {
        Some(row) => row.get::<bool>("mutual").map_err(graph_error)?,
        None => false,
    };

    Ok(MutualStatus { mutual })
}

pub async fn block_status(
    graph: &Graph,
    username: &str,
    other: &str,
) -> Result<BlockStatus, AppError> {
    let mut rows = graph
        .execute(
            neo4rs::query(
                "MATCH (a:User {username: $username}), (b:User {username: $other}) \
                 RETURN EXISTS((a)-[:BLOCKED]->(b)) AS blocked, \
                        EXISTS((b)-[:BLOCKED]->(a)) AS blocked_by",
            )
            .param("username", username)
            .param("other", other),
        )
        .await
        .map_err(graph_error)?;

    let (blocked, blocked_by) = match rows.next().await.map_err(graph_error)? {
        Some(row) => (
            row.get::<bool>("blocked").map_err(graph_error)?,
            row.get::<bool>("blocked_by").map_err(graph_error)?,
        ),
        None => (false, false),
    };

    Ok(BlockStatus {
        blocked,
        blocked_by,
    })
}

pub async fn followers(
    graph: &Graph,
    username: &str,
    cursor: Option<&str>,
    limit: u32,
) -> Result<Page<FollowUser>, AppError> {
    let mut rows = graph
        .execute(
            neo4rs::query(
                "MATCH (follower:User)-[:FOLLOWS]->(u:User {username: $username}) \
                 WHERE NOT (follower)-[:BLOCKED]->(u) \
                   AND NOT (u)-[:BLOCKED]->(follower) \
                   AND ($cursor = '' OR follower.username > $cursor) \
                 RETURN follower.id AS user_id, follower.username AS username \
                 ORDER BY follower.username \
                 LIMIT $limit",
            )
            .param("username", username)
            .param("cursor", cursor.unwrap_or_default())
            .param("limit", i64::from(limit) + 1),
        )
        .await
        .map_err(graph_error)?;

    let users = collect_users!(&mut rows);
    Ok(paginate(users, limit))
}

pub async fn followings(
    graph: &Graph,
    username: &str,
    cursor: Option<&str>,
    limit: u32,
) -> Result<Page<FollowUser>, AppError> {
    let mut rows = graph
        .execute(
            neo4rs::query(
                "MATCH (u:User {username: $username})-[:FOLLOWS]->(followee:User) \
                 WHERE NOT (u)-[:BLOCKED]->(followee) \
                   AND NOT (followee)-[:BLOCKED]->(u) \
                   AND ($cursor = '' OR followee.username > $cursor) \
                 RETURN followee.id AS user_id, followee.username AS username \
                 ORDER BY followee.username \
                 LIMIT $limit",
            )
            .param("username", username)
            .param("cursor", cursor.unwrap_or_default())
            .param("limit", i64::from(limit) + 1),
        )
        .await
        .map_err(graph_error)?;

    let users = collect_users!(&mut rows);
    Ok(paginate(users, limit))
}

/// Unpaginated followee usernames for the feed service's read path.
pub async fn all_followings(
    graph: &Graph,
    username: &str,
    limit: u32,
) -> Result<Vec<String>, AppError> {
    let mut rows = graph
        .execute(
            neo4rs::query(
                "MATCH (u:User {username: $username})-[:FOLLOWS]->(followee:User) \
                 WHERE NOT (u)-[:BLOCKED]->(followee) \
                   AND NOT (followee)-[:BLOCKED]->(u) \
                 RETURN followee.username AS username \
                 ORDER BY followee.username \
                 LIMIT $limit",
            )
            .param("username", username)
            .param("limit", i64::from(limit)),
        )
        .await
        .map_err(graph_error)?;

    let mut usernames = Vec::new();
    while let Some(row) = rows.next().await.map_err(graph_error)? {
        usernames.push(row.get::<String>("username").map_err(graph_error)?);
    }

    Ok(usernames)
}

pub async fn friends(
    graph: &Graph,
    username: &str,
    cursor: Option<&str>,
    limit: u32,
) -> Result<Page<FollowUser>, AppError> {
    let mut rows = graph
        .execute(
            neo4rs::query(
                "MATCH (me:User {username: $username})-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(me) \
                 WHERE NOT (me)-[:BLOCKED]->(friend) \
                   AND NOT (friend)-[:BLOCKED]->(me) \
                   AND ($cursor = '' OR friend.username > $cursor) \
                 RETURN friend.id AS user_id, friend.username AS username \
                 ORDER BY friend.username \
                 LIMIT $limit",
            )
            .param("username", username)
            .param("cursor", cursor.unwrap_or_default())
            .param("limit", i64::from(limit) + 1),
        )
        .await
        .map_err(graph_error)?;

    let users = collect_users!(&mut rows);
    Ok(paginate(users, limit))
}

pub async fn mutual_followings(
    graph: &Graph,
    username1: &str,
    username2: &str,
    cursor: Option<&str>,
    limit: u32,
) -> Result<Page<FollowUser>, AppError> {
    let mut rows = graph
        .execute(
            neo4rs::query(
                "MATCH (u1:User {username: $username1})-[:FOLLOWS]->(common:User)<-[:FOLLOWS]-(u2:User {username: $username2}) \
                 WHERE NOT (u1)-[:BLOCKED]->(u2) AND NOT (u2)-[:BLOCKED]->(u1) \
                   AND NOT (u1)-[:BLOCKED]->(common) AND NOT (common)-[:BLOCKED]->(u1) \
                   AND NOT (u2)-[:BLOCKED]->(common) AND NOT (common)-[:BLOCKED]->(u2) \
                   AND ($cursor = '' OR common.username > $cursor) \
                 RETURN common.id AS user_id, common.username AS username \
                 ORDER BY common.username \
                 LIMIT $limit",
            )
            .param("username1", username1)
            .param("username2", username2)
            .param("cursor", cursor.unwrap_or_default())
            .param("limit", i64::from(limit) + 1),
        )
        .await
        .map_err(graph_error)?;

    let users = collect_users!(&mut rows);
    Ok(paginate(users, limit))
}

pub async fn mutual_followers(
    graph: &Graph,
    username1: &str,
    username2: &str,
    cursor: Option<&str>,
    limit: u32,
) -> Result<Page<FollowUser>, AppError> {
    let mut rows = graph
        .execute(
            neo4rs::query(
                "MATCH (u1:User {username: $username1})<-[:FOLLOWS]-(common:User)-[:FOLLOWS]->(u2:User {username: $username2}) \
                 WHERE NOT (u1)-[:BLOCKED]->(u2) AND NOT (u2)-[:BLOCKED]->(u1) \
                   AND NOT (u1)-[:BLOCKED]->(common) AND NOT (common)-[:BLOCKED]->(u1) \
                   AND NOT (u2)-[:BLOCKED]->(common) AND NOT (common)-[:BLOCKED]->(u2) \
                   AND ($cursor = '' OR common.username > $cursor) \
                 RETURN common.id AS user_id, common.username AS username \
                 ORDER BY common.username \
                 LIMIT $limit",
            )
            .param("username1", username1)
            .param("username2", username2)
            .param("cursor", cursor.unwrap_or_default())
            .param("limit", i64::from(limit) + 1),
        )
        .await
        .map_err(graph_error)?;

    let users = collect_users!(&mut rows);
    Ok(paginate(users, limit))
}

pub async fn suggestions(
    graph: &Graph,
    username: &str,
    limit: u32,
) -> Result<Vec<Suggestion>, AppError> {
    let mut rows = graph
        .execute(
            neo4rs::query(
                "MATCH (me:User {username: $username})-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(candidate:User) \
                 WHERE candidate.username <> $username \
                   AND NOT (me)-[:BLOCKED]->(friend) \
                   AND NOT (friend)-[:BLOCKED]->(me) \
                   AND NOT (me)-[:FOLLOWS]->(candidate) \
                   AND NOT (me)-[:BLOCKED]->(candidate) \
                   AND NOT (candidate)-[:BLOCKED]->(me) \
                 RETURN candidate.id AS user_id, candidate.username AS username, count(*) AS mutuals \
                 ORDER BY mutuals DESC, candidate.username \
                 LIMIT $limit",
            )
            .param("username", username)
            .param("limit", i64::from(limit)),
        )
        .await
        .map_err(graph_error)?;

    let mut suggestions = Vec::new();
    while let Some(row) = rows.next().await.map_err(graph_error)? {
        let user_id: String = row.get("user_id").map_err(graph_error)?;
        let username: String = row.get("username").map_err(graph_error)?;
        let mutuals: i64 = row.get("mutuals").map_err(graph_error)?;
        if let Ok(user_id) = Uuid::parse_str(&user_id) {
            suggestions.push(Suggestion {
                user_id,
                username,
                mutuals,
            });
        }
    }

    Ok(suggestions)
}

pub async fn blocked_users(
    graph: &Graph,
    username: &str,
    cursor: Option<&str>,
    limit: u32,
) -> Result<Page<FollowUser>, AppError> {
    let mut rows = graph
        .execute(
            neo4rs::query(
                "MATCH (me:User {username: $username})-[:BLOCKED]->(blocked:User) \
                 WHERE ($cursor = '' OR blocked.username > $cursor) \
                 RETURN blocked.id AS user_id, blocked.username AS username \
                 ORDER BY blocked.username \
                 LIMIT $limit",
            )
            .param("username", username)
            .param("cursor", cursor.unwrap_or_default())
            .param("limit", i64::from(limit) + 1),
        )
        .await
        .map_err(graph_error)?;

    let users = collect_users!(&mut rows);
    Ok(paginate(users, limit))
}

fn paginate(mut items: Vec<FollowUser>, limit: u32) -> Page<FollowUser> {
    let limit = limit as usize;
    let next_cursor = if items.len() > limit {
        items.truncate(limit);
        items.last().map(|user| user.username.clone())
    } else {
        None
    };

    Page { items, next_cursor }
}

fn graph_error(error: impl std::fmt::Display) -> AppError {
    AppError::Internal(anyhow::anyhow!("{error}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn user(username: &str) -> FollowUser {
        FollowUser {
            user_id: Uuid::now_v7(),
            username: username.to_string(),
        }
    }

    #[test]
    fn paginates_with_a_next_cursor() {
        let page = paginate(vec![user("alice"), user("bob"), user("carol")], 2);
        assert_eq!(page.items.len(), 2);
        assert_eq!(page.next_cursor.as_deref(), Some("bob"));
    }

    #[test]
    fn no_cursor_when_the_page_is_exact() {
        let page = paginate(vec![user("alice"), user("bob")], 2);
        assert_eq!(page.items.len(), 2);
        assert_eq!(page.next_cursor, None);
    }
}
