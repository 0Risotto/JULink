"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveConversation } from "../store/chatSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import CreateDMDialog from "./CreateDMDialog";
import CreateGroupDialog from "./CreateGroupDialog";
import { PlusCircle, Users } from "lucide-react";
import { useUser } from "@/domain/profile/hooks/useUser";

export default function ChatSidebar() {
  const dispatch = useAppDispatch();
  const { myUsername } = useUser();
  const { conversations, activeConversationId, loadingConversations } = useAppSelector((state) => state.chat);

  if (loadingConversations && conversations.length === 0) {
    return (
      <div className="w-80 border-r flex flex-col h-full bg-card">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Chats</h2>
        </div>
        <div className="p-4 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r flex flex-col h-full bg-card">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Chats</h2>
        <div className="flex gap-2">
          <CreateDMDialog
            trigger={
              <Button variant="ghost" size="icon" title="New Direct Message">
                <PlusCircle className="w-5 h-5" />
              </Button>
            }
          />
          <CreateGroupDialog
            trigger={
              <Button variant="ghost" size="icon" title="New Group">
                <Users className="w-5 h-5" />
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => {
          // Determine title and image
          let title = conv.groupName || "Group";
          let image = conv.groupPictureUrl;
          if (!conv.group) {
            const otherUser = conv.members.find((m) => m.username !== myUsername) || conv.members[0];
            title = otherUser?.firstName ? `${otherUser.firstName} ${otherUser.lastName}` : otherUser?.username;
            image = otherUser?.profilePictureUrl || null;
          }

          const isActive = conv.id === activeConversationId;
          const lastMsg = conv.lastMessage;
          const unread = conv.unreadCount > 0;

          return (
            <div
              key={conv.id}
              onClick={() => dispatch(setActiveConversation(conv.id))}
              className={`p-3 border-b flex items-center gap-3 cursor-pointer transition-colors ${
                isActive ? "bg-accent" : "hover:bg-accent/50"
              }`}
            >
              <Avatar>
                <AvatarImage src={image || undefined} />
                <AvatarFallback>{title ? title[0].toUpperCase() : "?"}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className={`text-sm truncate ${unread ? "font-bold" : "font-medium"}`}>{title}</p>
                  {lastMsg && (
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(lastMsg.sentAt), { addSuffix: false })}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className={`text-xs truncate ${unread ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                    {lastMsg ? (
                      lastMsg.messageType === "TEXT" ? lastMsg.content : `[${lastMsg.messageType}]`
                    ) : (
                      <span className="italic">No messages yet</span>
                    )}
                  </p>
                  {unread && (
                    <Badge className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {conversations.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No conversations yet. Start a new chat!
          </div>
        )}
      </div>
    </div>
  );
}
