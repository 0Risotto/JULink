package com.example.Julink.controller;

import com.example.Julink.dto.CreateUserRequestDTO;
import com.example.Julink.dto.LoginUserDTO;
import com.example.Julink.dto.OTPDTO;
import com.example.Julink.dto.SendOTPDTO;
import com.example.Julink.enums.College;
import com.example.Julink.reposotiry.UserRepo;
import com.example.Julink.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private UserRepo userRepo;

    @Mock
    private BCryptPasswordEncoder encoder;

    @InjectMocks
    private UserController userController;

    @Test
    void createUser_shouldCallServiceAndReturnSuccess() {
        CreateUserRequestDTO dto = new CreateUserRequestDTO(
                "ahmad",
                "ahmad@ju.edu.jo",
                "Ahmad",
                "Almanasrah",
                College.KING_ABDULLAH_II_IT,
                "password123"
        );

        String result = userController.createUser(dto);

        assertEquals("success", result);
        verify(userService).createUser(dto);
    }

    @Test
    void sendOTP_shouldCallServiceAndReturnSuccess() {
        SendOTPDTO dto = new SendOTPDTO("user@ju.edu.jo");

        String result = userController.sendOTP(dto);

        assertEquals("success", result);
        verify(userService).sendOTP("user@ju.edu.jo");
    }

    @Test
    void checkOTPValidity_shouldCallServiceAndReturnSuccess() {
        OTPDTO dto = new OTPDTO("123456", "user@ju.edu.jo");

        String result = userController.checkOTPValidity(dto);

        assertEquals("success", result);
        verify(userService).verifyOTP("123456", "user@ju.edu.jo");
    }

    @Test
    void loginUser_shouldCallServiceAndReturnSuccess() {
        LoginUserDTO dto = new LoginUserDTO("user@ju.edu.jo", "secret123");

        String result = userController.loginUser(dto);

        assertEquals("success", result);
        verify(userService).loginUser(dto);
    }
}
