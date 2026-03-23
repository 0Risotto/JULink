package com.graduation.julink.follow;

public class FollowDTOs {

    public record FollowerListDto(
            String username,
            String fullName,
            String profilePictureUrl
    ) {}
}
