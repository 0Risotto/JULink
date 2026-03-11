package com.graduation.julink.token;

import com.graduation.julink.common.TokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TokenController {

    private static final Logger logger = LoggerFactory.getLogger(TokenController.class);

    private final TokenService tokenService;

    public TokenController(TokenService tokenService) {
        this.tokenService = tokenService;

    }

    @PostMapping("/token")
    public String token(Authentication authentication) {
        logger.debug("Token reqeusted for user: {}", authentication.getName());
        String token = tokenService.generateToken(authentication);
        logger.debug("Token granted {}", token);
        return token;
    }


}
