"use client";

import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart } from "lucide-react";
import { CommentResponseDTO } from "../types";
import { getPostComments, toggleCommentLike, deleteComment, updateComment } from "../services/postServices";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Trash2, Edit2, X, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUser } from "@/domain/profile/hooks/useUser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CommentListProps {
  postId: string;
  postOwnerUsername?: string;
  compact?: boolean;
  refreshTrigger?: number; // Optional prop to trigger a refetch when new comment is added from outside
}

export default function CommentList({ postId, postOwnerUsername, compact, refreshTrigger = 0 }: CommentListProps) {
  const [comments, setComments] = useState<CommentResponseDTO[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const { currentUser } = useUser();
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

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.commentId !== commentId));
    } catch (error) {
      console.error("Failed to delete comment", error);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      const res = await updateComment(commentId, { content: editContent });
      setComments(prev => prev.map(c => c.commentId === commentId ? { ...c, content: res.content } : c));
      setEditingCommentId(null);
    } catch (error) {
      console.error("Failed to update comment", error);
    }
  };

  const formatTimeCompact = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  return (
    <div className={`flex flex-col gap-4 mt-2 ${compact ? 'mb-4' : ''}`}>
      {loading ? (
        <div className="text-center text-gray-500 text-sm py-4">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-2">No comments yet.</div>
      ) : (
        comments.map((comment) => (
          <div key={comment.commentId} className="flex group relative w-full pt-1">
            {/* Avatar */}
            <Avatar className="w-8 h-8 shrink-0 mr-3">
              <AvatarImage src={comment.profilePictureUrl || undefined} className="object-cover" />
              <AvatarFallback>{comment.firstName?.[0]}{comment.lastName?.[0]}</AvatarFallback>
            </Avatar>
            
            {/* Content Container */}
            <div className="flex flex-col flex-1 min-w-0 pr-8">
              {/* Username + Text Inline */}
              <div className="text-[14px] leading-[1.4] break-words">
                <span className="font-semibold mr-2">{comment.username}</span>
                {editingCommentId === comment.commentId ? (
                  <div className="flex flex-col gap-2 mt-1">
                    <Input 
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="h-8 text-[14px]"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleUpdateComment(comment.commentId);
                        if (e.key === 'Escape') setEditingCommentId(null);
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="h-7 text-xs bg-[#1a73e8]" onClick={() => handleUpdateComment(comment.commentId)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingCommentId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{comment.content}</span>
                )}
              </div>

              {/* Metadata Row */}
              <div className="flex items-center gap-4 mt-[4px] text-[12px] text-muted-foreground opacity-90">
                <span>{formatTimeCompact(comment.createdAt)}</span>
                
                {comment.likesCount > 0 && (
                  <span className="font-semibold text-foreground/80">
                    {comment.likesCount} {comment.likesCount === 1 ? 'like' : 'likes'}
                  </span>
                )}
                
                <button className="font-semibold text-foreground/80 hover:text-foreground transition-colors">
                  Reply
                </button>

                {!editingCommentId && (currentUser?.username === comment.username || currentUser?.username === postOwnerUsername) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity text-foreground/80 hover:text-foreground">
                        <MoreHorizontal size={14} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-32">
                      {currentUser?.username === comment.username && (
                        <DropdownMenuItem onClick={() => {
                          setEditingCommentId(comment.commentId);
                          setEditContent(comment.content);
                        }}>
                          <Edit2 size={14} className="mr-2" /> Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleDeleteComment(comment.commentId)}>
                        <Trash2 size={14} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Like Button (Far Right) */}
            <button 
              onClick={() => handleLikeComment(comment.commentId, comment.likedByCurrentUser, comment.likesCount)}
              className="absolute right-0 top-1 p-1 transition-opacity hover:opacity-60 shrink-0"
            >
              <Heart 
                size={14} 
                className={comment.likedByCurrentUser ? "fill-pink-500 text-pink-500" : "text-muted-foreground"} 
              />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
