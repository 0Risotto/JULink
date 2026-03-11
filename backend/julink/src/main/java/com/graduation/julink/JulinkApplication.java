package com.graduation.julink;

import com.graduation.julink.common.config.RSAKeyProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@EnableConfigurationProperties(RSAKeyProperties.class)
@SpringBootApplication
public class JulinkApplication {

	public static void main(String[] args) {
		SpringApplication.run(JulinkApplication.class, args);
	}

}
