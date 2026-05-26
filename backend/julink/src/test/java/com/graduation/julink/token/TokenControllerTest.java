package com.graduation.julink.token;

import com.graduation.julink.common.TokenService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenControllerTest {

    @Mock
    private TokenService tokenService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private TokenController tokenController;

    @Test
    void token_Success() {
        when(authentication.getName()).thenReturn("testuser");
        when(tokenService.generateToken(authentication)).thenReturn("mock-token");

        String result = tokenController.token(authentication);

        assertEquals("mock-token", result);
    }
}
