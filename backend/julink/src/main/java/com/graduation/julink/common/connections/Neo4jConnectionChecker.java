package com.graduation.julink.common.connections;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.data.neo4j.core.Neo4jClient;

@Component
public class Neo4jConnectionChecker {

    private static final Logger log = LoggerFactory.getLogger(Neo4jConnectionChecker.class);
    private final Neo4jClient neo4jClient;

    public Neo4jConnectionChecker(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void checkConnection() {
        try {
            neo4jClient.query("RETURN 1").fetch().one();
            log.info("Neo4j connected successfully");
        } catch (Exception e) {
            log.error("Neo4j connection failed: {}", e.getMessage());
        }
    }
}