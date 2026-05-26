"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { fetchConversations } from "@/domain/chat/store/chatSlice";
import { useUser } from "@/domain/profile/hooks/useUser";
import { useChatWebSocket } from "@/domain/chat/hooks/useChatWebSocket";
import ChatSidebar from "@/domain/chat/components/ChatSidebar";
import ChatWindow from "@/domain/chat/components/ChatWindow";
export default function ChatPage() {
  const dispatch = useAppDispatch();
  const { myUsername, loadMyUsername } = useUser();
  // STOMP WebSocket Hook
  const { sendMessage, sendTyping, markRead, initiateCall } = useChatWebSocket(myUsername);

  useEffect(() => {
    // Make sure we have the username loaded
    if (!myUsername) {
      loadMyUsername().catch(console.error);
    }
  }, [myUsername, loadMyUsername]);

  useEffect(() => {
    if (myUsername) {
      dispatch(fetchConversations());
    }
  }, [dispatch, myUsername]);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] w-full overflow-hidden border rounded-lg mt-4">
      {/* Sidebar: Conversation List */}
      <ChatSidebar />

      {/* Main Window: Active Conversation Messages */}
      <ChatWindow 
        onSendMessage={sendMessage}
        onSendTyping={sendTyping}
        onMarkRead={markRead}
        onInitiateCall={initiateCall}
      />
    </div>
  );
}
