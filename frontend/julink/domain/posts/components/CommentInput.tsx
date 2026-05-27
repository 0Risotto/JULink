"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { createComment } from "../services/postServices";
import { useUser } from "@/domain/profile/hooks/useUser";
import { CommentResponseDTO } from "../types";

interface CommentInputProps {
  postId: string;
  onCommentCreated?: (comment: CommentResponseDTO) => void;
}

export default function CommentInput({ postId, onCommentCreated }: CommentInputProps) {
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { currentUser } = useUser();

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await createComment(postId, { content: newComment });
      setNewComment("");
      if (onCommentCreated) {
        onCommentCreated(res);
      }
    } catch (error) {
      console.error("Failed to create comment", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex gap-3 items-center w-full">
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={currentUser?.profilePicture || undefined} />
        <AvatarFallback>{currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}</AvatarFallback>
      </Avatar>
      <form onSubmit={handleCreateComment} className="flex-1 flex gap-2">
        <Input 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="rounded-full bg-gray-50 dark:bg-zinc-900 border-none h-9 focus-visible:ring-1"
        />
        <Button 
          type="submit" 
          size="icon" 
          variant="ghost" 
          disabled={!newComment.trim() || submitting}
          className="text-blue-500 rounded-full h-9 w-9 shrink-0"
        >
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
}
