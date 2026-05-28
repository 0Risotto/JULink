"use client";

import React, { useEffect, useState } from "react";
import { getPostById } from "@/domain/posts/services/postServices";
import { PostResponseDTO } from "@/domain/posts/types";
import { Spinner } from "@/components/ui/spinner";
import { FileText } from "lucide-react";

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
        className="w-14 h-14 border bg-muted/30 flex items-center justify-center shrink-0"
        style={{ borderRadius: "12px" }}
      >
        <Spinner className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return null;
  }

  // Get the first image attachment if available
  const imageAttachment = post.attachments.find(
    (att) => att.attachmentType === "IMAGE" || att.attachmentType === "image"
  );

  return (
    <div 
      className="w-14 h-14 border bg-muted/50 overflow-hidden shrink-0 flex items-center justify-center relative group shadow-sm hover:border-primary/40 transition-all"
      title={`Preview of post: "${post.description.slice(0, 60)}..."`}
      style={{ borderRadius: "12px" }}
    >
      {imageAttachment ? (
        <img 
          src={imageAttachment.attachmentUrl} 
          alt="Post thumbnail" 
          className="w-full h-full object-cover"
          style={{ borderRadius: "12px" }}
        />
      ) : (
        <div 
          className="p-1.5 flex flex-col h-full w-full bg-muted/80 text-[8px] text-muted-foreground leading-tight select-none overflow-hidden justify-between"
          style={{ borderRadius: "12px" }}
        >
          <span className="line-clamp-3 font-medium scale-[0.95] origin-top-left leading-[10px] break-words">
            {post.description}
          </span>
          <FileText className="w-2.5 h-2.5 text-muted-foreground/50 self-end mt-auto shrink-0" />
        </div>
      )}
    </div>
  );
}
