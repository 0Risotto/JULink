package com.graduation.julink.follow;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RequiredArgsConstructor
@Repository
public class FollowRepository {

    private final Neo4jClient neo4jClient;

    public void createUser(String username) {
        String query = "MERGE (u:User {username: $username}) RETURN u";
        neo4jClient.query(query)
                .bind(username).to("username")
                .run();
    }

    public void deleteUser(String username) {
        String query = """
            MATCH (u:User {username: $username})
            DETACH DELETE u
            """;
        neo4jClient.query(query)
                .bind(username).to("username")
                .run();
    }


    public boolean userExists(String username) {
        String query = "MATCH (u:User {username: $username}) RETURN u";
        return neo4jClient.query(query)
                .bind(username).to("username")
                .fetch()
                .first()
                .isPresent();
    }

    public void follow(String followerUsername, String followeeUsername) {
        String query = """
            MATCH (follower:User {username: $follower})
            MATCH (followee:User {username: $followee})
            WHERE NOT (follower)-[:BLOCKED]->(followee)
              AND NOT (followee)-[:BLOCKED]->(follower)
            MERGE (follower)-[:FOLLOWS]->(followee)
            """;
        neo4jClient.query(query)
                .bind(followerUsername).to("follower")
                .bind(followeeUsername).to("followee")
                .run();
    }

    public void unfollow(String followerUsername, String followeeUsername) {
        String query = """
            MATCH (follower:User {username: $follower})-[r:FOLLOWS]->(followee:User {username: $followee})
            DELETE r
            """;
        neo4jClient.query(query)
                .bind(followerUsername).to("follower")
                .bind(followeeUsername).to("followee")
                .run();
    }

    public boolean isFollowing(String followerUsername, String followeeUsername) {
        String query = """
            MATCH (follower:User {username: $follower})-[r:FOLLOWS]->(followee:User {username: $followee})
            WHERE NOT (follower)-[:BLOCKED]->(followee)
              AND NOT (followee)-[:BLOCKED]->(follower)
            RETURN r
            """;
        return neo4jClient.query(query)
                .bind(followerUsername).to("follower")
                .bind(followeeUsername).to("followee")
                .fetch()
                .first()
                .isPresent();
    }

    public boolean isMutual(String username1, String username2) {
        String query = """
            MATCH (u1:User {username: $username1})-[r1:FOLLOWS]->(u2:User {username: $username2})
            MATCH (u2)-[r2:FOLLOWS]->(u1)
            WHERE NOT (u1)-[:BLOCKED]->(u2)
              AND NOT (u2)-[:BLOCKED]->(u1)
            RETURN r1, r2
            """;
        return neo4jClient.query(query)
                .bind(username1).to("username1")
                .bind(username2).to("username2")
                .fetch()
                .first()
                .isPresent();
    }

    public Page<String> getFollowers(String username, Pageable pageable) {
        String query = """
            MATCH (follower:User)-[:FOLLOWS]->(u:User {username: $username})
            WHERE NOT (follower)-[:BLOCKED]->(u)
              AND NOT (u)-[:BLOCKED]->(follower)
            RETURN follower.username AS username
            ORDER BY follower.username
            SKIP $skip
            LIMIT $limit
            """;
        String countQuery = """
            MATCH (follower:User)-[:FOLLOWS]->(u:User {username: $username})
            WHERE NOT (follower)-[:BLOCKED]->(u)
              AND NOT (u)-[:BLOCKED]->(follower)
            RETURN count(follower) AS total
            """;

        // Execute count query
        Long total = neo4jClient.query(countQuery)
                .bind(username).to("username")
                .fetchAs(Long.class)
                .mappedBy((typeSystem, record) -> record.get("total").asLong())
                .one()
                .orElse(0L);

        // Execute paginated query
        List<String> followers = neo4jClient.query(query)
                .bind(username).to("username")
                .bind(pageable.getOffset()).to("skip")
                .bind(pageable.getPageSize()).to("limit")
                .fetchAs(String.class)
                .mappedBy((typeSystem, record) -> record.get("username").asString())
                .all()
                .stream().toList();

        return new PageImpl<>(followers, pageable, total);
    }

    public Page<String> getFollowings(String username, Pageable pageable) {
        String query = """
            MATCH (u:User {username: $username})-[:FOLLOWS]->(followee:User)
            WHERE NOT (u)-[:BLOCKED]->(followee)
              AND NOT (followee)-[:BLOCKED]->(u)
            RETURN followee.username AS username
            ORDER BY followee.username
            SKIP $skip
            LIMIT $limit
            """;
        String countQuery = """
            MATCH (u:User {username: $username})-[:FOLLOWS]->(followee:User)
            WHERE NOT (u)-[:BLOCKED]->(followee)
              AND NOT (followee)-[:BLOCKED]->(u)
            RETURN count(followee) AS total
            """;

        Long total = neo4jClient.query(countQuery)
                .bind(username).to("username")
                .fetchAs(Long.class)
                .mappedBy((typeSystem, record) -> record.get("total").asLong())
                .one()
                .orElse(0L);

        List<String> followings = neo4jClient.query(query)
                .bind(username).to("username")
                .bind(pageable.getOffset()).to("skip")
                .bind(pageable.getPageSize()).to("limit")
                .fetchAs(String.class)
                .mappedBy((typeSystem, record) -> record.get("username").asString())
                .all()
                .stream().toList();

        return new PageImpl<>(followings, pageable, total);
    }

    public Collection<String> getFollowingUsernames(String username) {
        String query = """
            MATCH (u:User {username: $username})-[:FOLLOWS]->(followee:User)
            WHERE NOT (u)-[:BLOCKED]->(followee)
              AND NOT (followee)-[:BLOCKED]->(u)
            RETURN followee.username AS username
            """;

        return neo4jClient.query(query)
                .bind(username).to("username")
                .fetchAs(String.class)
                .mappedBy((typeSystem, record) -> record.get("username").asString())
                .all();
    }

    public Page<String> getMutualFollowings(String username1, String username2, Pageable pageable) {
        String query = """
        MATCH (u1:User {username: $username1})-[:FOLLOWS]->(common:User)<-[:FOLLOWS]-(u2:User {username: $username2})
        WHERE NOT (u1)-[:BLOCKED]->(u2)
          AND NOT (u2)-[:BLOCKED]->(u1)
          AND NOT (u1)-[:BLOCKED]->(common)
          AND NOT (common)-[:BLOCKED]->(u1)
          AND NOT (u2)-[:BLOCKED]->(common)
          AND NOT (common)-[:BLOCKED]->(u2)
        RETURN common.username AS username
        ORDER BY common.username
        SKIP $skip
        LIMIT $limit
        """;
        String countQuery = """
        MATCH (u1:User {username: $username1})-[:FOLLOWS]->(common:User)<-[:FOLLOWS]-(u2:User {username: $username2})
        WHERE NOT (u1)-[:BLOCKED]->(u2)
          AND NOT (u2)-[:BLOCKED]->(u1)
          AND NOT (u1)-[:BLOCKED]->(common)
          AND NOT (common)-[:BLOCKED]->(u1)
          AND NOT (u2)-[:BLOCKED]->(common)
          AND NOT (common)-[:BLOCKED]->(u2)
        RETURN count(common) AS total
        """;

        Long total = neo4jClient.query(countQuery)
                .bind(username1).to("username1")
                .bind(username2).to("username2")
                .fetchAs(Long.class)
                .mappedBy((typeSystem, record) -> record.get("total").asLong())
                .one()
                .orElse(0L);

        List<String> mutualFollowings = neo4jClient.query(query)
                .bind(username1).to("username1")
                .bind(username2).to("username2")
                .bind(pageable.getOffset()).to("skip")
                .bind(pageable.getPageSize()).to("limit")
                .fetchAs(String.class)
                .mappedBy((typeSystem, record) -> record.get("username").asString())
                .all()
                .stream().toList();

        return new PageImpl<>(mutualFollowings, pageable, total);
    }

    public Page<String> getMutualFollowers(String username1, String username2, Pageable pageable) {
//        String query = """
//        MATCH (follower:User)-[:FOLLOWS]->(u1:User {username: $username1})
//        WHERE (follower)-[:FOLLOWS]->(u2:User {username: $username2})
//        RETURN follower.username AS username
//        ORDER BY follower.username
//        SKIP $skip
//        LIMIT $limit
//        """;
        String query = """
            MATCH (u1:User {username: $username1})<-[:FOLLOWS]-(follower:User)-[:FOLLOWS]->(u2:User {username: $username2})
            WHERE NOT (u1)-[:BLOCKED]->(u2)
              AND NOT (u2)-[:BLOCKED]->(u1)
              AND NOT (u1)-[:BLOCKED]->(follower)
              AND NOT (follower)-[:BLOCKED]->(u1)
              AND NOT (u2)-[:BLOCKED]->(follower)
              AND NOT (follower)-[:BLOCKED]->(u2)
            RETURN follower.username AS username
            ORDER BY follower.username
            SKIP $skip
            LIMIT $limit
            """;

//        String countQuery = """
//        MATCH (follower:User)-[:FOLLOWS]->(u1:User {username: $username1})
//        WHERE (follower)-[:FOLLOWS]->(u2:User {username: $username2})
//        RETURN count(follower) AS total
//        """;

        String countQuery = """
            MATCH (u1:User {username: $username1})<-[:FOLLOWS]-(follower:User)-[:FOLLOWS]->(u2:User {username: $username2})
            WHERE NOT (u1)-[:BLOCKED]->(u2)
              AND NOT (u2)-[:BLOCKED]->(u1)
              AND NOT (u1)-[:BLOCKED]->(follower)
              AND NOT (follower)-[:BLOCKED]->(u1)
              AND NOT (u2)-[:BLOCKED]->(follower)
              AND NOT (follower)-[:BLOCKED]->(u2)
            RETURN count(follower) AS total
            """;

        Long total = neo4jClient.query(countQuery)
                .bind(username1).to("username1")
                .bind(username2).to("username2")
                .fetchAs(Long.class)
                .mappedBy((typeSystem, record) -> record.get("total").asLong())
                .one()
                .orElse(0L);

        List<String> mutualFollowers = neo4jClient.query(query)
                .bind(username1).to("username1")
                .bind(username2).to("username2")
                .bind(pageable.getOffset()).to("skip")
                .bind(pageable.getPageSize()).to("limit")
                .fetchAs(String.class)
                .mappedBy((typeSystem, record) -> record.get("username").asString())
                .all()
                .stream().toList();

        return new PageImpl<>(mutualFollowers, pageable, total);
    }

}
