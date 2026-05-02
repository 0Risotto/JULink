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
    public String initiate(String email, Long friendId){
        AuthEntities.User currentUser = authRepository.findByEmail(email).orElseThrow(()->new RuntimeException("User email not found"));
        AuthEntities.User  friend = authRepository.findById(friendId).orElseThrow(()->new RuntimeException("User friend not found"));

        if(!areFriends(currentUser.getUsername(),friend.getUsername())){
            return "Not friends";
        }

        String roomName = "JuLink-" + UUID.randomUUID().toString().substring(0, 8);
        String jitsiUrl = "https://meet.jit.si/" + roomName;

        var payload = Map.of(
                "targetId", friendId,             // The recipient checks this
                "callerUsername", currentUser.getUsername(),
                "videoUrl", jitsiUrl,
                "type", "INVITE_TO_VIDEO"
        );

        messagingTemplate.convertAndSend("/topic/video-calls", payload);

        System.out.println("📢 Call broadcasted from " + currentUser.getUsername() + " for ID: " + friendId);

        return jitsiUrl;
    }
}
