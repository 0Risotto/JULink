"use client";

import { useEffect, useRef } from "react";
import { MessageResponse } from "../types";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CheckCheck, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import MessageMedia from "./media";
import Link from "next/link";
import { PostPreview } from "@/domain/notifications/components/PostPreview";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface MessageListProps {
  messages: MessageResponse[];
  myUsername: string;
  typingUsers: string[];
  onEditMessage?: (msg: MessageResponse) => void;
  onDeleteMessage?: (msgId: number) => void;
}

export default function MessageList({ messages, myUsername, typingUsers, onEditMessage, onDeleteMessage }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" ref={scrollRef}>
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          No messages yet. Say hi!
        </div>
      )}

      {messages.map((msg, idx) => {
        const isMe = msg.sender.username === myUsername;
        const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender.username !== msg.sender.username);

        return (
          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
            {!isMe && (
              <div className="w-8 shrink-0">
                {showAvatar && (
                  <Link href={`/${msg.sender.username}`}>
                    <Avatar className="w-8 h-8 hover:opacity-80 transition-opacity cursor-pointer">
                      <AvatarImage src={msg.sender.profilePictureUrl || undefined} />
                      <AvatarFallback>{msg.sender.firstName?.[0] || msg.sender.username[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                )}
              </div>
            )}

            <div className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              {showAvatar && (
                <span className="text-xs text-muted-foreground ml-1 mb-1">{msg.sender.firstName} {msg.sender.lastName}</span>
              )}
              
              <div className={`flex items-center gap-2 group/msg ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                {(() => {
                  const isMediaOrPost = !!msg.mediaUrl || !!msg.sharedPostId;
                  return (
                    <div
                      className={`rounded-2xl text-sm ${
                        isMediaOrPost ? "p-0" : "p-3"
                      } ${
                        isMediaOrPost 
                          ? "" 
                          : isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <MessageMedia msg={msg} isMe={isMe} />
                      {msg.deleted ? (
                        <span className="italic opacity-70 p-3 block bg-muted rounded-2xl text-muted-foreground">This message was deleted</span>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {msg.sharedPostId && (
                            <PostPreview postId={msg.sharedPostId} />
                          )}
                          {msg.content && (
                            <p className={`whitespace-pre-wrap break-words ${
                              isMediaOrPost 
                                ? `p-3 rounded-2xl ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}` 
                                : ""
                            }`}>
                              {msg.content}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {isMe && !msg.deleted && (
                  <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isMe ? "end" : "start"}>
                        {msg.messageType === "TEXT" && (
                          <DropdownMenuItem onClick={() => onEditMessage?.(msg)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => onDeleteMessage?.(msg.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                <span>{format(new Date(msg.sentAt), "HH:mm")}</span>
                {msg.editedAt && <span>(edited)</span>}
                {isMe && (
                  <span className="ml-1">
                    {msg.status === "READ" ? (
                      <CheckCheck className="w-3 h-3 text-blue-500" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {typingUsers.length > 0 && (
        <div className="flex justify-start gap-2">
          <div className="w-8 shrink-0" />
          <div className="bg-muted p-3 rounded-2xl rounded-tl-sm text-sm text-muted-foreground flex items-center gap-1">
            <span className="animate-pulse">.</span>
            <span className="animate-pulse delay-75">.</span>
            <span className="animate-pulse delay-150">.</span>
          </div>
        </div>
      )}
    </div>
  );
}
