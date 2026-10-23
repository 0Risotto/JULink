"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { ConversationResponse } from "@/domain/chat/types";
import * as chatApi from "@/domain/chat/api/chatApi";
import { useUser } from "@/domain/profile/hooks/useUser";

interface SharePostDialogProps {
  postId: string;
  trigger: React.ReactNode;
}

export default function SharePostDialog({ postId, trigger }: SharePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sharedConvIds, setSharedUserIds] = useState<string[]>([]);
  const { myUsername } = useUser();

  useEffect(() => {
    if (open) {
      setLoading(true);
      setSharedUserIds([]);
      chatApi.getConversations()
        .then((res) => {
          setConversations(res);
        })
        .catch((err) => {
          console.error("Failed to load conversations for sharing", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open]);

  const handleShare = async (convId: string) => {
    try {
      await chatApi.sharePost(convId, { postId });
      setSharedUserIds((prev) => [...prev, convId]);
    } catch (err) {
      console.error("Failed to share post to conversation:", err);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (conv.group) {
      return conv.groupName?.toLowerCase().includes(search.toLowerCase());
    }
    const otherUser = conv.members.find((m) => m.username !== myUsername) || conv.members[0];
    const otherName = otherUser?.firstName ? `${otherUser.firstName} ${otherUser.lastName}` : otherUser?.username;
    return otherName?.toLowerCase().includes(search.toLowerCase()) || otherUser?.username?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2 text-xs h-8"
        />

        <div className="flex flex-col gap-2 mt-4 max-h-60 overflow-y-auto pr-1">
          {loading && conversations.length === 0 ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : (
            <>
              {filteredConversations.map((conv) => {
                let title = conv.groupName || "Group";
                let image = conv.groupPictureUrl;
                if (!conv.group) {
                  const otherUser = conv.members.find((m) => m.username !== myUsername) || conv.members[0];
                  title = otherUser?.firstName ? `${otherUser.firstName} ${otherUser.lastName}` : otherUser?.username;
                  image = otherUser?.profilePictureUrl || null;
                }

                const isShared = sharedConvIds.includes(conv.id);

                return (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={image || undefined} />
                        <AvatarFallback className="text-xs">{title ? title[0].toUpperCase() : "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-semibold truncate max-w-[150px]">{title}</span>
                        {conv.group ? (
                          <span className="text-[9px] text-muted-foreground">{conv.members.length} members</span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground">Direct Message</span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isShared ? "secondary" : "default"}
                      className="h-7 text-xs px-3"
                      onClick={() => handleShare(conv.id)}
                      disabled={isShared}
                    >
                      {isShared ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1 text-green-500" />
                          Shared
                        </>
                      ) : (
                        "Send"
                      )}
                    </Button>
                  </div>
                );
              })}

              {filteredConversations.length === 0 && !loading && (
                <p className="text-xs text-muted-foreground text-center py-4">No active conversations found</p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
