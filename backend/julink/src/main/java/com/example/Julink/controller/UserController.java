package com.example.Julink.controller;


import com.example.Julink.dto.CreateUserRequestDTO;
import com.example.Julink.dto.OTPDTO;
import com.example.Julink.dto.SendOTPDTO;
import com.example.Julink.reposotiry.UserRepo;
import com.example.Julink.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin (origins = "http://localhost:*")
@RestController
@RequiredArgsConstructor
@RequestMapping("/entry")
public class UserController {

    private final UserService userService;
    private final UserRepo userRepo;
    private final BCryptPasswordEncoder passwordEncoder;


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
    @PostMapping("/CheckOTPValidity")
    public String checkOTPValidity(@RequestBody OTPDTO dto){
        userService.verifyOTP(dto.otp(),dto.email());
        return "success";
    }
}
