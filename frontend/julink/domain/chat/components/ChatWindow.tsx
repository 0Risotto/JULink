"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMessages, setActiveConversation } from "../store/chatSlice";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/domain/profile/hooks/useUser";
import { Phone, Video, Settings, ChevronLeft } from "lucide-react";
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
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-background/50 p-6 text-center select-none">
        <div className="w-20 h-20 rounded-full bg-secondary/60 flex items-center justify-center mb-5 animate-in fade-in zoom-in duration-300">
          <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Your Messages</h2>
        <p className="text-muted-foreground/80 mt-2 text-sm max-w-xs">Select an existing chat or create a new conversation to start messaging.</p>
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
    <div className={`flex-1 flex flex-col h-full bg-background transition-all ${
      activeConversationId === null ? "hidden md:flex" : "flex"
    }`}>
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between bg-background/95 backdrop-blur-sm sticky top-0 z-10 select-none h-16">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Back button on mobile */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-9 w-9 rounded-full hover:bg-muted/65 shrink-0" 
            onClick={() => dispatch(setActiveConversation(null))}
          >
            <ChevronLeft className="w-6 h-6 text-primary" />
          </Button>

          {!activeConv.group && otherUser ? (
            <>
              <Link href={`/${otherUser.username}`} className="shrink-0">
                <Avatar className="h-10 w-10 hover:opacity-85 transition-opacity cursor-pointer border border-muted-foreground/10">
                  <AvatarImage src={image || undefined} className="object-cover" />
                  <AvatarFallback className="font-semibold text-sm">{title ? title[0].toUpperCase() : "?"}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex flex-col min-w-0">
                <h2 className="font-semibold text-sm text-foreground truncate leading-tight">{title}</h2>
                <span className="text-[11px] text-muted-foreground truncate">{subtitle}</span>
              </div>
            </>
          ) : (
            <GroupSettingsDialog
              conversation={activeConv}
              trigger={
                <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-all min-w-0 text-left">
                  <Avatar className="h-10 w-10 shrink-0 border border-muted-foreground/10">
                    <AvatarImage src={image || undefined} className="object-cover" />
                    <AvatarFallback className="font-semibold text-sm">{title ? title[0].toUpperCase() : "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <h2 className="font-semibold text-sm text-foreground truncate leading-tight">{title}</h2>
                    <span className="text-[11px] text-muted-foreground truncate">{subtitle}</span>
                  </div>
                </div>
              }
            />
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!activeConv.group ? (
            <>
              <Button variant="ghost" size="icon" title="Audio Call" onClick={handleAudioCall} className="h-9 w-9 rounded-full text-primary hover:bg-muted/65 hover:text-primary">
                <Phone className="w-4.5 h-4.5" />
              </Button>
              <Button variant="ghost" size="icon" title="Video Call" onClick={handleVideoCall} className="h-9 w-9 rounded-full text-primary hover:bg-muted/65 hover:text-primary">
                <Video className="w-4.5 h-4.5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" title="Group Audio Call" onClick={handleGroupAudioCall} className="h-9 w-9 rounded-full text-primary hover:bg-muted/65 hover:text-primary">
                <Phone className="w-4.5 h-4.5" />
              </Button>
              <Button variant="ghost" size="icon" title="Group Video Call" onClick={handleGroupVideoCall} className="h-9 w-9 rounded-full text-primary hover:bg-muted/65 hover:text-primary">
                <Video className="w-4.5 h-4.5" />
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
