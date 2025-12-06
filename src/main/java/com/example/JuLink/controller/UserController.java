package com.example.JuLink.controller;


import com.example.JuLink.dto.CreateUserRequestDTO;
import com.example.JuLink.dto.LoginUserDTO;
import com.example.JuLink.dto.OTPDTO;
import com.example.JuLink.dto.SendOTPDTO;
import com.example.JuLink.reposotiry.UserRepo;
import com.example.JuLink.service.TokenService;
import com.example.JuLink.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
//
//@CrossOrigin (origins = "http://localhost:*")
@RestController
@RequiredArgsConstructor
@RequestMapping("/entry")
public class UserController {

    private final UserService userService;
    private final UserRepo userRepo;
    private final BCryptPasswordEncoder passwordEncoder;
    private final TokenService tokenService;


    @PostMapping("/createUser")
    public String createUser(@RequestBody CreateUserRequestDTO createUserRequestDTO) {
        userService.createUser(createUserRequestDTO);
        return "success";
    }

    @PostMapping("/sendOTP")
    public String sendOTP(@RequestBody SendOTPDTO sendOTPDTO) {
        userService.sendOTP(sendOTPDTO.email());
        System.out.println("controller reached");
        return "success";

    }
    @PostMapping("/checkOTPValidity")
    public String checkOTPValidity(@RequestBody OTPDTO dto){
        userService.verifyOTP(dto.otp(),dto.email());
        return "success";
    }

    @PostMapping("/loginUser")
    public Map<String, Object> loginUser(@RequestBody LoginUserDTO loginUserDTO){
        try {
            var auth = userService.loginUser(loginUserDTO);
            if (auth == null) {

                return Map.of("status", "fail", "message", "Invalid email or password");
            }
            String token = tokenService.generateToken(auth);
            return Map.of("status", "success", "token", token);
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }
}
