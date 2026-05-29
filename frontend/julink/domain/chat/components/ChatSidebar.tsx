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
      <div className="w-full md:w-80 border-r flex flex-col h-full bg-background">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Chats</h2>
        </div>
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`w-full md:w-80 border-r flex flex-col h-full bg-background shrink-0 transition-all ${
      activeConversationId !== null ? "hidden md:flex" : "flex"
    }`}>
      <div className="p-4 border-b flex justify-between items-center bg-background">
        <h2 className="text-2xl font-bold tracking-tight">Chats</h2>
        <div className="flex gap-1">
          <CreateDMDialog
            trigger={
              <Button variant="ghost" size="icon" title="New Direct Message" className="rounded-full hover:bg-muted/60">
                <PlusCircle className="w-5.5 h-5.5 text-primary" />
              </Button>
            }
          />
          <CreateGroupDialog
            trigger={
              <Button variant="ghost" size="icon" title="New Group" className="rounded-full hover:bg-muted/60">
                <Users className="w-5.5 h-5.5 text-primary" />
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-2 pb-20 md:pb-2 bg-background space-y-0.5">
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
              className={`mx-2 my-1 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 select-none ${
                isActive 
                  ? "bg-secondary text-secondary-foreground" 
                  : "hover:bg-muted/45 active:scale-[0.98]"
              }`}
            >
              <Avatar className="h-11 w-11 border-2 border-transparent">
                <AvatarImage src={image || undefined} className="object-cover" />
                <AvatarFallback className="bg-muted-foreground/10 text-sm font-semibold">
                  {title ? title[0].toUpperCase() : "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className={`text-sm truncate leading-tight ${unread ? "font-semibold text-foreground" : "font-medium text-foreground/90"}`}>
                    {title}
                  </p>
                  {lastMsg && (
                    <span className="text-[10px] text-muted-foreground/80 whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(lastMsg.sentAt), { addSuffix: false })}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className={`text-xs truncate ${unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {lastMsg ? (
                      lastMsg.messageType === "TEXT" ? lastMsg.content : `[${lastMsg.messageType}]`
                    ) : (
                      <span className="italic">No messages yet</span>
                    )}
                  </p>
                  {unread && (
                    <span className="ml-2 w-2.5 h-2.5 rounded-full bg-primary shrink-0 animate-in fade-in" />
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
