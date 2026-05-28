"use client";

import React, { useEffect, useState } from "react";
import { getPostById } from "@/domain/posts/services/postServices";
import { PostResponseDTO } from "@/domain/posts/types";
import { Spinner } from "@/components/ui/spinner";
import { FileText } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PostDetailsModal from "@/domain/posts/components/PostDetailsModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PostPreviewProps {
  postId: string;
}

export function PostPreview({ postId }: PostPreviewProps) {
  const [post, setPost] = useState<PostResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getPostById(postId)
      .then((res) => {
        if (active) {
          setPost(res);
        }
      })
      .catch((err) => {
        console.error("Failed to load post preview:", err);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [postId]);

  if (loading) {
    return (
      <div 
        className="w-[280px] h-[180px] border rounded-xl bg-muted/20 flex flex-col items-center justify-center shrink-0"
      >
        <Spinner className="w-5 h-5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground mt-2">Loading shared post...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-xs text-muted-foreground p-3 italic bg-muted/10 border rounded-xl w-[280px]">
        Shared post is unavailable or deleted
      </div>
    );
  }

  // Get the first attachment if available
  const firstAttachment = post.attachments?.[0];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div 
          className="w-[280px] bg-card dark:bg-zinc-900 overflow-hidden shrink-0 flex flex-col relative group shadow-sm hover:shadow-md transition-all cursor-pointer text-card-foreground text-left rounded-xl"
        >
          {/* Header: [pfp(username)] */}
          <div className="flex items-center gap-2 p-2.5 bg-muted/20 shrink-0 select-none">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.ownerProfilePictureUrl || undefined} alt={post.ownerUsername} />
              <AvatarFallback className="text-[10px]">
                {post.ownerFirstName ? post.ownerFirstName[0] : post.ownerUsername[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-xs font-bold truncate max-w-[150px]">
                {post.ownerFirstName ? `${post.ownerFirstName} ${post.ownerLastName}` : post.ownerUsername}
              </span>
              <span className="text-[9px] text-muted-foreground truncate">@{post.ownerUsername}</span>
            </div>
          </div>

          {/* Content: post content (image, video, or full description) */}
          <div className="flex-1 flex flex-col bg-muted/10">
            {firstAttachment ? (
              <div className="w-full h-32 overflow-hidden relative">
                {firstAttachment.attachmentType?.toLowerCase().includes("video") ? (
                  <video 
                    src={firstAttachment.attachmentUrl} 
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img 
                    src={firstAttachment.attachmentUrl} 
                    alt="Post thumbnail" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ) : (
              <div className="p-3 text-xs leading-relaxed max-h-32 overflow-hidden text-ellipsis line-clamp-4 select-none">
                {post.description}
              </div>
            )}
          </div>

          {/* Footer: [username + caption] */}
          <div className="p-2.5 bg-muted/10 shrink-0 text-xs select-none">
            <p className="line-clamp-2 leading-tight">
              <span className="font-bold mr-1.5">@{post.ownerUsername}</span>
              <span className="text-muted-foreground">{post.description}</span>
            </p>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] md:max-w-[900px] lg:max-w-[1000px] p-0 bg-transparent border-none shadow-none focus:outline-none">
        <PostDetailsModal post={post} />
      </DialogContent>
    </Dialog>
  );
}
