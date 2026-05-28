"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMessages } from "../store/chatSlice";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/domain/profile/hooks/useUser";
import { Phone, Video, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as chatApi from "../api/chatApi";
import { MessageResponse } from "../types";
import GroupSettingsDialog from "./GroupSettingsDialog";

interface ChatWindowProps {
  onSendMessage: (conversationId: number, content: string) => void;
  onSendTyping: (conversationId: number, isTyping: boolean) => void;
  onMarkRead: (conversationId: number, lastMessageId: number) => void;
  onInitiateCall: (friendUsername: string) => void;
}

export default function ChatWindow({ onSendMessage, onSendTyping, onMarkRead, onInitiateCall }: ChatWindowProps) {
  const dispatch = useAppDispatch();
  const { myUsername } = useUser();
  const { activeConversationId, conversations, messagesByConvId, typingState, loadingMessages } = useAppSelector((state) => state.chat);
  const [editingMessage, setEditingMessage] = useState<MessageResponse | null>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConv ? messagesByConvId[activeConv.id] || [] : [];
  const typingUsers = activeConv ? (typingState[activeConv.id] || []).filter((u) => u !== myUsername) : [];
  const isLoading = activeConv ? loadingMessages[activeConv.id] : false;

  useEffect(() => {
    if (activeConversationId) {
      // Always fetch the latest messages when opening a conversation 
      // to ensure we don't show stale messages if we received some while on another page
      dispatch(fetchMessages({ conversationId: activeConversationId }));
    }
  }, [activeConversationId, dispatch]);

  useEffect(() => {
    // Mark as read when active conversation changes or new messages arrive
    if (activeConversationId && messages.length > 0 && myUsername) {
      const lastMsg = messages[messages.length - 1];
      // Call the REST endpoint to guarantee delivery even if WebSocket is connecting
      chatApi.markReadRest(activeConversationId, lastMsg.id, myUsername).catch((err) => {
        console.error("Failed to mark as read", err);
      });
    }
  }, [activeConversationId, messages.length, myUsername]);

  if (!activeConv || !myUsername) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/30">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Your Messages</h2>
        <p className="text-muted-foreground mt-2">Select a chat or start a new conversation</p>
      </div>
    );
  }

  // Determine header title and image
  let title = activeConv.groupName || "Group";
  let image = activeConv.groupPictureUrl;
  let subtitle = `${activeConv.members.length} members`;

  const otherUser = !activeConv.group 
    ? (activeConv.members.find((m) => m.username !== myUsername) || activeConv.members[0])
    : null;

  if (!activeConv.group && otherUser) {
    title = otherUser.firstName ? `${otherUser.firstName} ${otherUser.lastName}` : otherUser.username;
    image = otherUser.profilePictureUrl || null;
    subtitle = `@${otherUser.username}`;
  }

  const handleAudioCall = () => {
    if (otherUser) {
      sessionStorage.setItem("callType", "audio");
      onInitiateCall(otherUser.username);
    }
  };

  const handleVideoCall = () => {
    if (otherUser) {
      sessionStorage.setItem("callType", "video");
      onInitiateCall(otherUser.username);
    }
  };

  const handleGroupAudioCall = async () => {
    try {
      sessionStorage.setItem("callType", "audio");
      await chatApi.startGroupCall(activeConv.id, { videoCall: false });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to start group call.");
    }
  };

  const handleGroupVideoCall = async () => {
    try {
      sessionStorage.setItem("callType", "video");
      await chatApi.startGroupCall(activeConv.id, { videoCall: true });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to start group call.");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          {!activeConv.group && otherUser ? (
            <>
              <Link href={`/${otherUser.username}`}>
                <Avatar className="hover:opacity-80 transition-opacity cursor-pointer">
                  <AvatarImage src={image || undefined} />
                  <AvatarFallback>{title ? title[0].toUpperCase() : "?"}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex flex-col">
                <h2 className="font-bold">{title}</h2>
                <span className="text-xs text-muted-foreground">{subtitle}</span>
              </div>
            </>
          ) : (
            <GroupSettingsDialog
              conversation={activeConv}
              trigger={
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar>
                    <AvatarImage src={image || undefined} />
                    <AvatarFallback>{title ? title[0].toUpperCase() : "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <h2 className="font-bold">{title}</h2>
                    <span className="text-xs text-muted-foreground">{subtitle}</span>
                  </div>
                </div>
              }
            />
          )}
        </div>

        <div className="flex gap-2">
          {!activeConv.group ? (
            <>
              <Button variant="ghost" size="icon" title="Audio Call" onClick={handleAudioCall}>
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" title="Video Call" onClick={handleVideoCall}>
                <Video className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" title="Group Audio Call" onClick={handleGroupAudioCall}>
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" title="Group Video Call" onClick={handleGroupVideoCall}>
                <Video className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {isLoading && messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">Loading...</div>
      ) : (
        <MessageList 
          messages={messages} 
          myUsername={myUsername} 
          typingUsers={typingUsers} 
          onEditMessage={setEditingMessage}
          onDeleteMessage={async (msgId) => {
            try {
              await chatApi.deleteMessage(msgId);
            } catch (err) {
              console.error("Failed to delete message", err);
            }
          }}
        />
      )}

      {/* Input */}
      <MessageInput 
        conversationId={activeConv.id}
        onSendMessage={(content) => onSendMessage(activeConv.id, content)}
        onSendTyping={(isTyping) => onSendTyping(activeConv.id, isTyping)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
}
