"use client";

import { useEffect, useRef } from "react";
import { MessageResponse } from "../types";
import { format, isToday, isYesterday } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CheckCheck, MoreHorizontal, Pencil, Trash2, MessageSquare } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: MessageResponse[];
  myUsername: string;
  typingUsers: string[];
  onEditMessage?: (msg: MessageResponse) => void;
  onDeleteMessage?: (msgId: number) => void;
  title?: string;
  image?: string | null;
  subtitle?: string;
  otherUser?: any;
}

export default function MessageList({ 
  messages, 
  myUsername, 
  typingUsers, 
  onEditMessage, 
  onDeleteMessage,
  title,
  image,
  subtitle,
  otherUser
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessagesRef = useRef<MessageResponse[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      const isNewMessage = messages.length > 0 && 
        lastMessagesRef.current.length > 0 && 
        messages[messages.length - 1].id !== lastMessagesRef.current[lastMessagesRef.current.length - 1].id;

      if (isNewMessage) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      } else {
        // Instant scroll to bottom on initial load / conversation change
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      lastMessagesRef.current = messages;
    }
  }, [messages, typingUsers]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let lastHeight = container.scrollHeight;

    const observer = new ResizeObserver(() => {
      const currentHeight = container.scrollHeight;
      const heightDifference = currentHeight - lastHeight;
      lastHeight = currentHeight;

      // Only force scroll to bottom if user is already near bottom, or height did not change (so they don't get yanked back down while reading history)
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      if (isNearBottom || heightDifference === 0) {
        container.scrollTop = container.scrollHeight;
      }
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col h-full bg-background select-none" ref={scrollRef}>
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center animate-in fade-in duration-300">
          <div className="p-4 bg-muted/40 rounded-full mb-3 text-primary">
            <MessageSquare className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-foreground/80">No messages yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Send a message or media file to begin the conversation!</p>
        </div>
      )}

      <div className="space-y-0.5 mt-auto">
        {/* Premium Profile Header Card at the very top of messages list with generous spacing */}
        {messages.length > 0 && title && (
          <div className="flex flex-col items-center justify-center text-center pt-16 pb-12 px-4 mb-16 bg-gradient-to-b from-muted/5 to-transparent rounded-3xl animate-in fade-in duration-300 select-none">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md mb-4 transition-transform hover:scale-105 duration-300">
              <AvatarImage src={image || undefined} className="object-cover" />
              <AvatarFallback className="bg-muted-foreground/10 text-3xl font-bold">
                {title ? title[0].toUpperCase() : "?"}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-extrabold text-foreground leading-tight tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground/80 mt-1">{subtitle}</p>
            {otherUser && (
              <Link href={`/${otherUser.username}`} className="mt-5">
                <Button variant="outline" size="sm" className="rounded-full text-xs font-semibold px-5 py-2 h-9 hover:bg-muted/70 transition-all shadow-xs">
                  View Profile
                </Button>
              </Link>
            )}
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.sender.username === myUsername;

          // Time gap analysis (15 mins)
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const hasTimeGap = prevMsg ? (new Date(msg.sentAt).getTime() - new Date(prevMsg.sentAt).getTime() > 15 * 60 * 1000) : false;

          const isGroupedWithPrev = prevMsg && prevMsg.sender.username === msg.sender.username && !hasTimeGap;

          const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
          const hasNextTimeGap = nextMsg ? (new Date(nextMsg.sentAt).getTime() - new Date(msg.sentAt).getTime() > 15 * 60 * 1000) : false;

          const isGroupedWithNext = nextMsg && nextMsg.sender.username === msg.sender.username && !hasNextTimeGap;

          // Display sender details & avatars on boundaries
          const showSenderName = !isMe && !isGroupedWithPrev;
          const showAvatar = !isMe && !isGroupedWithNext;

          // Center divider date formatting
          const showDateDivider = idx === 0 || hasTimeGap;
          const formatDateDivider = (dateString: string) => {
            const date = new Date(dateString);
            if (isToday(date)) {
              return `Today, ${format(date, "HH:mm")}`;
            }
            if (isYesterday(date)) {
              return `Yesterday, ${format(date, "HH:mm")}`;
            }
            return format(date, "MMM d, yyyy, HH:mm");
          };

          // Border radii mapping for Messenger-style bubble grouping
          let bubbleRadiusClass = "rounded-2xl";
          if (isMe) {
            if (isGroupedWithPrev && isGroupedWithNext) {
              bubbleRadiusClass = "rounded-2xl rounded-tr-sm rounded-br-sm";
            } else if (isGroupedWithPrev) {
              bubbleRadiusClass = "rounded-2xl rounded-tr-sm";
            } else if (isGroupedWithNext) {
              bubbleRadiusClass = "rounded-2xl rounded-br-sm";
            }
          } else {
            if (isGroupedWithPrev && isGroupedWithNext) {
              bubbleRadiusClass = "rounded-2xl rounded-tl-sm rounded-bl-sm";
            } else if (isGroupedWithPrev) {
              bubbleRadiusClass = "rounded-2xl rounded-tl-sm";
            } else if (isGroupedWithNext) {
              bubbleRadiusClass = "rounded-2xl rounded-bl-sm";
            }
          }

          return (
            <div key={msg.id} className="flex flex-col">
              {showDateDivider && (
                <div className="flex justify-center my-6 animate-in fade-in duration-300">
                  <span className="text-[11px] font-semibold text-muted-foreground/90 bg-secondary/80 px-3 py-1 rounded-full shadow-sm">
                    {formatDateDivider(msg.sentAt)}
                  </span>
                </div>
              )}

              <div 
                className={cn(
                  "flex gap-2.5 items-end group/msg relative w-full",
                  isMe ? "justify-end" : "justify-start",
                  !isGroupedWithPrev && !showDateDivider ? "mt-3" : "mt-0.5"
                )}
              >
                {/* Left side avatar (Incoming only) */}
                {!isMe && (
                  <div className="w-8 shrink-0 flex justify-center items-center">
                    {showAvatar ? (
                      <Link href={`/${msg.sender.username}`}>
                        <Avatar className="w-8 h-8 hover:opacity-85 transition-opacity cursor-pointer border border-muted-foreground/10 shadow-xs">
                          <AvatarImage src={msg.sender.profilePictureUrl || undefined} className="object-cover" />
                          <AvatarFallback className="font-semibold text-xs bg-muted text-muted-foreground">
                            {msg.sender.firstName?.[0] || msg.sender.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : (
                      <div className="w-8 h-8" />
                    )}
                  </div>
                )}

                <div className={cn("max-w-[70%] flex flex-col", isMe ? "items-end" : "items-start")}>
                  {/* Sender Name above group */}
                  {showSenderName && (
                    <span className="text-[11px] text-muted-foreground font-medium ml-1.5 mb-1 animate-in fade-in">
                      {msg.sender.firstName} {msg.sender.lastName}
                    </span>
                  )}
                  
                  <div className={cn("flex items-center gap-2 relative", isMe ? "flex-row-reverse" : "flex-row")}>
                    {(() => {
                      const isMediaOrPost = !!msg.mediaUrl || !!msg.sharedPostId;
                      return (
                        <div
                          className={cn(
                            "text-[14.5px] leading-relaxed relative transition-all duration-150 shadow-xs",
                            bubbleRadiusClass,
                            isMediaOrPost ? "p-0 bg-transparent shadow-none" : "px-4 py-2.5",
                            isMediaOrPost 
                              ? "" 
                              : isMe 
                                ? "bg-primary text-primary-foreground font-normal" 
                                : "bg-muted/75 text-foreground font-normal border border-border/20"
                          )}
                        >
                          <MessageMedia msg={msg} isMe={isMe} />
                          {msg.deleted ? (
                            <span className="italic opacity-70 py-1 block text-muted-foreground">This message was deleted</span>
                          ) : (
                            <div className="flex flex-col gap-2.5">
                              {msg.sharedPostId && (
                                <div className="rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-200 bg-background/50 border">
                                  <PostPreview postId={msg.sharedPostId} />
                                </div>
                              )}
                              {msg.content && (
                                <p className={cn(
                                  "whitespace-pre-wrap break-words font-sans",
                                  isMediaOrPost 
                                    ? cn(
                                        "px-4 py-2.5 mt-2 rounded-2xl border",
                                        isMe 
                                          ? "bg-primary text-primary-foreground border-transparent" 
                                          : "bg-muted/75 text-foreground border-border/20"
                                      )
                                    : ""
                                )}>
                                  {msg.content}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Quick message options on hover */}
                    {isMe && !msg.deleted && (
                      <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-muted/75">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isMe ? "end" : "start"} className="rounded-xl min-w-[110px]">
                            {msg.messageType === "TEXT" && (
                              <DropdownMenuItem onClick={() => onEditMessage?.(msg)} className="rounded-lg py-2">
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                <span className="text-xs">Edit</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => onDeleteMessage?.(msg.id)}
                              className="text-destructive focus:text-destructive rounded-lg py-2"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              <span className="text-xs">Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>

                  {/* Micro timestamp & status details - shown by default for group end, shown on hover for mid-group */}
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] text-muted-foreground/80 transition-all duration-200 select-none",
                    !isGroupedWithNext 
                      ? "opacity-100 h-4 mt-1" 
                      : "opacity-0 h-0 overflow-hidden group-hover/msg:opacity-100 group-hover/msg:h-4 group-hover/msg:mt-1"
                  )}>
                    <span>{format(new Date(msg.sentAt), "HH:mm")}</span>
                    {msg.editedAt && <span>(edited)</span>}
                    {isMe && (
                      <span className="ml-0.5">
                        {msg.status === "READ" ? (
                          <CheckCheck className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Polish Typing Bouncing Animation */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start gap-2.5 mt-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="w-8 shrink-0 flex justify-center">
              {/* Standard typing avatar circle */}
              <div className="w-8 h-8 rounded-full bg-secondary/50 border flex items-center justify-center text-xs font-bold text-muted-foreground">
                {typingUsers[0][0].toUpperCase()}
              </div>
            </div>
            <div className="bg-muted/70 px-4 py-3 rounded-2xl rounded-tl-sm text-sm flex items-center gap-1.5 w-fit border border-border/10">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
