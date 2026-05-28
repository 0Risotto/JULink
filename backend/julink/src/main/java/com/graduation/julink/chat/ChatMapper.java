package com.graduation.julink.chat;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.chat.ChatDTOs.*;
import com.graduation.julink.chat.ChatEntities.*;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ChatMapper {

    public UserSummary toUserSummary(User user) {
        return toUserSummary(user, null);
    }

    public UserSummary toUserSummary(User user, Boolean admin) {
        return UserSummary.builder()
                .id(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .profilePictureUrl(user.getProfilePictureUrl())
                .admin(admin)
                .build();
    }

    public MessageResponse toMessageResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .sender(toUserSummary(message.getSender()))
                .content(message.isDeleted() ? null : message.getContent())
                .messageType(message.getMessageType())
                .status(message.getStatus())
                .mediaUrl(message.isDeleted() ? null : message.getMediaUrl())
                .mediaFilename(message.isDeleted() ? null : message.getMediaFilename())
                .mediaSizeBytes(message.getMediaSizeBytes())
                .sharedPostId(message.isDeleted() ? null : message.getSharedPostId())
                .deleted(message.isDeleted())
                .sentAt(message.getSentAt())
                .editedAt(message.getEditedAt())
                .build();
    }

    public ConversationResponse toConversationResponse(Conversation conv,
                                                        Message lastMessage,
                                                        int unreadCount) {
        List<UserSummary> members = conv.getMembers().stream()
                .map(m -> toUserSummary(m.getUser(), m.isAdmin()))
                .toList();

        return ConversationResponse.builder()
                .id(conv.getId())
                .group(conv.isGroup())
                .groupName(conv.getGroupName())
                .groupPictureUrl(conv.getGroupPictureUrl())
                .members(members)
                .lastMessage(lastMessage != null ? toMessageResponse(lastMessage) : null)
                .unreadCount(unreadCount)
                .updatedAt(conv.getUpdatedAt())
                .build();
    }
}
