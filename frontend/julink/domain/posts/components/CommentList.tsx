"use client";

import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart } from "lucide-react";
import { CommentResponseDTO } from "../types";
import { getPostComments, toggleCommentLike } from "../services/postServices";
import { formatDistanceToNow } from "date-fns";

interface CommentListProps {
  postId: string;
  compact?: boolean;
  refreshTrigger?: number; // Optional prop to trigger a refetch when new comment is added from outside
}

export default function CommentList({ postId, compact, refreshTrigger = 0 }: CommentListProps) {
  const [comments, setComments] = useState<CommentResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [postId, refreshTrigger]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await getPostComments(postId, "newest", 0, 50);
      setComments(res.content);
    } catch (error) {
      console.error("Failed to fetch comments", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean, currentCount: number) => {
    // Optimistic update
    setComments((prev) => 
      prev.map(c => c.commentId === commentId 
        ? { ...c, likedByCurrentUser: !isLiked, likesCount: isLiked ? currentCount - 1 : currentCount + 1 }
        : c
      )
    );

    try {
      const res = await toggleCommentLike(commentId);
      // Sync with server if needed
      setComments((prev) => 
        prev.map(c => c.commentId === commentId 
          ? { ...c, likedByCurrentUser: res.liked, likesCount: res.likesCount }
          : c
        )
      );
    } catch (error) {
      // Revert on failure
      setComments((prev) => 
        prev.map(c => c.commentId === commentId 
          ? { ...c, likedByCurrentUser: isLiked, likesCount: currentCount }
          : c
        )
      );
    }
  };

  return (
    <div className={`flex flex-col gap-4 mt-2 ${compact ? 'mb-4' : ''}`}>
      {loading ? (
        <div className="text-center text-gray-500 text-sm py-4">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-2">No comments yet.</div>
      ) : (
        comments.map((comment) => (
          <div key={comment.commentId} className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={comment.profilePictureUrl || undefined} />
              <AvatarFallback>{comment.firstName?.[0]}{comment.lastName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-gray-50 dark:bg-zinc-900 px-3 py-2 rounded-2xl rounded-tl-none inline-block">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-[13px]">{comment.firstName} {comment.lastName}</span>
                </div>
                <p className="text-[14px]">{comment.content}</p>
              </div>
              <div className="flex items-center gap-4 mt-1 ml-2 text-xs text-gray-500">
                <span>{comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ""}</span>
                <button 
                  onClick={() => handleLikeComment(comment.commentId, comment.likedByCurrentUser, comment.likesCount)}
                  className={`font-semibold hover:text-gray-700 dark:hover:text-gray-300 ${comment.likedByCurrentUser ? 'text-pink-500' : ''}`}
                >
                  Like
                </button>
                {comment.likesCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Heart size={10} className="fill-pink-500 text-pink-500" />
                    {comment.likesCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
