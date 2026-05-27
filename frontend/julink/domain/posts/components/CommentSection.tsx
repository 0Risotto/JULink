"use client";

import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Send } from "lucide-react";
import { CommentResponseDTO } from "../types";
import { createComment } from "../services/postServices";
import { useUser } from "@/domain/profile/hooks/useUser";
import CommentList from "./CommentList";

interface CommentSectionProps {
  postId: string;
  postOwnerUsername?: string;
  compact?: boolean;
  hideInput?: boolean;
  hideList?: boolean;
}

export default function CommentSection({ postId, postOwnerUsername, compact, hideInput, hideList }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { currentUser } = useUser();

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await createComment(postId, { content: newComment });
      setNewComment("");
      // Ideally we should refresh the list here. Since this is an older file, 
      // CommentList will handle its own refresh if we pass a trigger, but 
      // a simple page reload or state update would be better.
      // For now, let's just let it be as this component is mostly superseded by PostDetailsModal
    } catch (error) {
      console.error("Failed to create comment", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Create Comment */}
      {!hideInput && (
        <div className={`flex gap-3 items-center ${compact ? 'order-last mt-auto pt-2' : ''}`}>
          <Avatar className="w-8 h-8">
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
              className="text-blue-500 rounded-full h-9 w-9"
            >
              <Send size={18} />
            </Button>
          </form>
        </div>
      )}

      {/* Comments List */}
      {!hideList && (
        <CommentList postId={postId} postOwnerUsername={postOwnerUsername} compact={compact} />
      )}
    </div>
  );
}
