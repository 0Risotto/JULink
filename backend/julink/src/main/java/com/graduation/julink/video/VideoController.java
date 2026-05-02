package com.graduation.julink.video;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.security.Principal;


@Controller
@MessageMapping("/video")
public class VideoController {

    private final SimpMessagingTemplate messagingTemplate;
    private VideoService videoService;
    public VideoController(VideoService videoService, SimpMessagingTemplate messagingTemplate) {
        this.videoService = videoService;
        this.messagingTemplate = messagingTemplate;
    }


    @PreAuthorize("permitAll()")
    @MessageMapping("/hello")
    @SendTo("/topic/greetings")
    public String greeting(String message) {
        return "Hello, " + message + "!";
    }



    //quick note when im testing this i use the console of test.html

    //we first send this message stompClient.subscribe('/topic/test', function(msg) {
    //    console.log("SERVER RESPONSE:", msg.body);
    //});

    //then we send this stompClient.publish({
    //    destination: "/app/video/initiate",
    //    body: JSON.stringify({ id: 2 })
    //});

    @MessageMapping("/initiate")
    public void initiate(Principal principal, VideoDTOs.intiate dto) {
        try {

            String email = (principal != null) ? principal.getName() : "ahmad.test1@ju.edu.jo";
            videoService.initiate(email, dto.id());
        } catch (Exception e) {

            System.err.println("Error in VideoController.initiate: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @MessageMapping("/initiatee")
    public void initiatee(VideoDTOs.intiate dto) {
        System.out.println("DEBUG: Reached initiatee method!"); // <--- LOOK FOR THIS
        messagingTemplate.convertAndSend("/topic/test", "SIGNAL_TEST_SUCCESS");
    }
}
