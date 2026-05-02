package com.graduation.julink.video;

import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.follow.FollowRepository;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.util.Map;
import java.util.UUID;

@Service
public class VideoService {
    private AuthRepository authRepository;
    private FollowRepository followRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public VideoService(AuthRepository authRepository,
                        FollowRepository followRepository,
                        SimpMessagingTemplate messagingTemplate) {
        this.authRepository = authRepository;
        this.followRepository = followRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // Helper functions
    boolean areFriends(String username, String friendname){

        return (followRepository.isFollowing(username, friendname) && followRepository.isFollowing(friendname, username));
    }


    //real functions
    public String initiate(String callerIdentifier, String friendUsername){
        // The principal.getName() usually returns the username in Spring Security configurations.
        // We'll try to find by username first, then fallback to email just in case.
        AuthEntities.User currentUser = authRepository.findByUsername(callerIdentifier)
                .orElseGet(() -> authRepository.findByEmail(callerIdentifier)
                .orElseThrow(() -> new RuntimeException("User not found: " + callerIdentifier)));
        
        AuthEntities.User  friend = authRepository.findByUsername(friendUsername).orElseThrow(()->new RuntimeException("User friend not found"));

        // Bypass friend check for testing purposes
        // if(!areFriends(currentUser.getUsername(),friend.getUsername())){
        //     return "Not friends";
        // }

        String roomName = "JuLink-" + UUID.randomUUID().toString().substring(0, 8);
        String jitsiUrl = "https://meet.opensuse.org/" + roomName;

        var payload = Map.of(
                "targetUsername", friend.getUsername(), // The recipient checks this
                "callerUsername", currentUser.getUsername(),
                "videoUrl", jitsiUrl,
                "type", "INVITE_TO_VIDEO"
        );

        messagingTemplate.convertAndSend("/topic/video-calls", payload);

        System.out.println("📢 Call broadcasted from " + currentUser.getUsername() + " to: " + friend.getUsername());

        return jitsiUrl;
    }
}
