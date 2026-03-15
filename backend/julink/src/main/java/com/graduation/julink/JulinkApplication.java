package com.graduation.julink;

import com.graduation.julink.common.config.RSAKeyProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.neo4j.config.EnableNeo4jAuditing;

@EnableNeo4jAuditing
@EnableConfigurationProperties(RSAKeyProperties.class)
@SpringBootApplication
public class JulinkApplication {

	public static void main(String[] args) {
		SpringApplication.run(JulinkApplication.class, args);
	}

}
