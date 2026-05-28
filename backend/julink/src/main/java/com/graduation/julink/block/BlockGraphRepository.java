package com.graduation.julink.block;

import lombok.RequiredArgsConstructor;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
class BlockGraphRepository {
    private final Neo4jClient neo4jClient;

    void block(String blockerUsername, String blockedUsername) {
        String query = """
                MATCH (blocker:User {username: $blocker})
                MATCH (blocked:User {username: $blocked})
                MERGE (blocker)-[:BLOCKED]->(blocked)
                """;
        neo4jClient.query(query)
                .bind(blockerUsername).to("blocker")
                .bind(blockedUsername).to("blocked")
                .run();
    }

    void unblock(String blockerUsername, String blockedUsername) {
        String query = """
                MATCH (:User {username: $blocker})-[r:BLOCKED]->(:User {username: $blocked})
                DELETE r
                """;
        neo4jClient.query(query)
                .bind(blockerUsername).to("blocker")
                .bind(blockedUsername).to("blocked")
                .run();
    }
}
