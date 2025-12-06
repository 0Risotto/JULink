package com.example.JuLink.controller;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController

public class HomeController {
//test endpoint
@GetMapping("/home")
    String home(Principal p){
    return "Hello World " + p.getName();
}
}
