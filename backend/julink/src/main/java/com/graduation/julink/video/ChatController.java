package com.graduation.julink.video;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.security.access.prepost.PreAuthorize;


@Controller
public class ChatController {
    @PreAuthorize("permitAll()")
    @MessageMapping("/hello")
    @SendTo("/topic/greetings")
    public String greeting(String message) {
        return "Hello, " + message + "!";
    }

}
