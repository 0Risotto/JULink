"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Bookmark, Share, MoreHorizontal, Flag, ChevronLeft } from "lucide-react";
import { PostResponseDTO } from "../types";
import ReportDialog from "@/domain/report/components/ReportDialog";
import { toggleLike, toggleFavorite, deletePost } from "../services/postServices";
import { formatDistanceToNow } from "date-fns";
import { useAppSelector } from "@/store/hooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UpdatePostModal from "./UpdatePostModal";
import CommentList from "./CommentList";
import SharePostDialog from "./SharePostDialog";
import CommentInput from "./CommentInput";
import Link from "next/link";
import DoubleTapToLike from "./DoubleTapToLike";
import PostCarousel from "./PostCarousel";
import { renderHashtags } from "../utils/hashtagUtils";
import { DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PostDetailsModalProps {
  post: PostResponseDTO;
  onPostUpdated?: (updatedPost: PostResponseDTO) => void;
  onPostDeleted?: (postId: string) => void;
  commentsOnlyOnMobile?: boolean;
}

export default function PostDetailsModal({ 
  post, 
  onPostUpdated, 
  onPostDeleted, 
  commentsOnlyOnMobile = false 
}: PostDetailsModalProps) {
  const myUsername = useAppSelector((state) => state.user.myUsername);
  const [liked, setLiked] = useState(post.likedByCurrentUser);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [favorited, setFavorited] = useState(post.favoritedByCurrentUser);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [showCommentsMobile, setShowCommentsMobile] = useState(commentsOnlyOnMobile);

  const handleLike = async () => {
    // Optimistic update
    setLiked(!liked);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    try {
      const res = await toggleLike(post.postId);
      setLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch (error) {
      // Revert on failure
      setLiked(liked);
      setLikesCount(likesCount);
      console.error("Failed to toggle like", error);
    }
  };

  const handleFavorite = async () => {
    // Optimistic update
    setFavorited(!favorited);
    try {
      const res = await toggleFavorite(post.postId);
      setFavorited(res.favorited);
    } catch (error) {
      // Revert
      setFavorited(favorited);
      console.error("Failed to toggle favorite", error);
    }
  };

  const formattedDate = post.createdAt 
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : "";

  const handleDoubleTap = () => {
    if (!liked) handleLike();
  };

  const hasAttachments = post.attachments && post.attachments.length > 0;

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deletePost(post.postId);
        if (onPostDeleted) onPostDeleted(post.postId);
      } catch (error) {
        console.error("Failed to delete post", error);
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-[85vh] md:h-[600px] lg:h-[700px] bg-white dark:bg-zinc-950 overflow-hidden rounded-t-2xl rounded-b-none md:rounded-[var(--radius)]">
      {/* Mobile drag handle indicator */}
      <div className="md:hidden flex flex-col items-center pt-3 pb-1 shrink-0 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-900/50">
        <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-700" />
      </div>

      {/* Left side: Media (Post Image/Video View) */}
      <div className={cn(
        "w-full md:w-[60%] lg:w-[65%] bg-black flex items-center justify-center shrink-0 md:flex",
        hasAttachments ? "" : "bg-gray-100 dark:bg-zinc-900",
        showCommentsMobile ? "hidden" : "flex flex-1 md:h-full max-h-[50vh] md:max-h-none"
      )}>
        <DoubleTapToLike onDoubleTap={handleDoubleTap} className="w-full h-full flex items-center justify-center">
          {hasAttachments ? (
            <PostCarousel attachments={post.attachments} />
          ) : (
            <div className="p-8 text-center w-full max-w-lg">
               <p className="text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-200 break-words">
                  {post.description}
               </p>
            </div>
          )}
        </DoubleTapToLike>
      </div>

      {/* Right side: Comments & Info Panel */}
      <div className={cn(
        "w-full md:w-[40%] lg:w-[35%] flex flex-col h-full bg-white dark:bg-zinc-950 md:border-l border-gray-200 dark:border-zinc-800 min-h-0",
        showCommentsMobile ? "flex flex-1" : "hidden md:flex"
      )}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 pr-12 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center">
            {/* Back button on mobile when viewing comments from profile previews */}
            {!commentsOnlyOnMobile && showCommentsMobile && (
              <button 
                onClick={() => setShowCommentsMobile(false)}
                className="md:hidden p-1 mr-2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <Link href={`/${post.ownerUsername}`} className="flex items-center gap-3 group">
              <Avatar className="w-8 h-8 cursor-pointer group-hover:opacity-80 transition-opacity">
                <AvatarImage src={post.ownerProfilePictureUrl || undefined} />
                <AvatarFallback>{post.ownerFirstName?.[0]}{post.ownerLastName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-[14px] cursor-pointer group-hover:underline">
                  {post.ownerUsername}
                </span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {myUsername === post.ownerUsername ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                     <MoreHorizontal size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsUpdateModalOpen(true)}>
                    Update
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                     <MoreHorizontal size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <ReportDialog
                    targetType="POST"
                    targetId={post.postId}
                    trigger={
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-amber-600 dark:text-amber-500 hover:text-amber-700 cursor-pointer"
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        Report Post
                      </DropdownMenuItem>
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Scrollable Content: Caption + Comments List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Caption */}
          <div className="flex gap-3 mb-6">
            <Link href={`/${post.ownerUsername}`} className="shrink-0">
              <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={post.ownerProfilePictureUrl || undefined} />
                <AvatarFallback>{post.ownerFirstName?.[0]}{post.ownerLastName?.[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="text-[14px] leading-relaxed break-words pt-1">
               <Link href={`/${post.ownerUsername}`}>
                 <span className="font-semibold mr-2 cursor-pointer hover:underline">{post.ownerUsername}</span>
               </Link>
               <span className="whitespace-pre-wrap">{renderHashtags(post.description)}</span>
            </div>
          </div>

          {/* Comments List */}
          <CommentList postId={post.postId} postOwnerUsername={post.ownerUsername} compact={true} refreshTrigger={refreshTrigger} />
        </div>

        {/* Interaction Bar & Metadata */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-950">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleLike}
                className="hover:opacity-60 transition-opacity"
              >
                <Heart size={26} className={liked ? "fill-pink-500 text-pink-500" : ""} />
              </button>
              
              <button 
                onClick={() => setShowCommentsMobile(true)}
                className="hover:opacity-60 transition-opacity"
              >
                <MessageCircle size={26} />
              </button>
              
              <SharePostDialog
                postId={post.postId}
                trigger={
                  <button className="hover:opacity-60 transition-opacity">
                    <Share size={26} />
                  </button>
                }
              />
            </div>
            
            <button 
              onClick={handleFavorite}
              className="hover:opacity-60 transition-opacity"
            >
              <Bookmark size={26} className={favorited ? "fill-current" : ""} />
            </button>
          </div>

          <div className="font-semibold text-[14px] mb-1">
            {likesCount} likes
          </div>
          <div className="text-[12px] text-gray-500 uppercase tracking-wide mb-3">
            {formattedDate}
          </div>

          {/* Comment Input */}
          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800/50">
             <CommentInput 
                postId={post.postId} 
                onCommentCreated={() => setRefreshTrigger(prev => prev + 1)} 
             />
          </div>
        </div>
      </div>

      {/* Post details view for mobile when NOT comments-only and NOT showing comments */}
      {!commentsOnlyOnMobile && !showCommentsMobile && (
        <div className="md:hidden flex flex-col flex-1 p-4 bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-zinc-800/50">
            <Link href={`/${post.ownerUsername}`} className="flex items-center gap-3 group">
              <Avatar className="w-8 h-8 cursor-pointer">
                <AvatarImage src={post.ownerProfilePictureUrl || undefined} />
                <AvatarFallback>{post.ownerFirstName?.[0]}{post.ownerLastName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-[14px]">{post.ownerUsername}</span>
              </div>
            </Link>
          </div>

          {/* Caption */}
          <div className="text-[14px] leading-relaxed break-words mb-4">
            <Link href={`/${post.ownerUsername}`}>
              <span className="font-semibold mr-2 hover:underline">{post.ownerUsername}</span>
            </Link>
            <span className="whitespace-pre-wrap">{renderHashtags(post.description)}</span>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800/50">
            {/* Interaction Bar */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <button onClick={handleLike} className="hover:opacity-60 transition-opacity">
                  <Heart size={26} className={liked ? "fill-pink-500 text-pink-500" : ""} />
                </button>
                <button onClick={() => setShowCommentsMobile(true)} className="hover:opacity-60 transition-opacity">
                  <MessageCircle size={26} />
                </button>
                <SharePostDialog
                  postId={post.postId}
                  trigger={
                    <button className="hover:opacity-60 transition-opacity">
                      <Share size={26} />
                    </button>
                  }
                />
              </div>
              <button onClick={handleFavorite} className="hover:opacity-60 transition-opacity">
                <Bookmark size={26} className={favorited ? "fill-current" : ""} />
              </button>
            </div>

            <div className="font-semibold text-[14px] mb-1">{likesCount} likes</div>
            <div className="text-[12px] text-gray-500 uppercase tracking-wide mb-3">{formattedDate}</div>

            {/* Clickable Comments Trigger Box */}
            <button 
              onClick={() => setShowCommentsMobile(true)}
              className="w-full text-left py-2.5 px-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-sm text-muted-foreground flex justify-between items-center"
            >
              <span>{post.commentsCount > 0 ? `View all ${post.commentsCount} comments...` : "Add a comment..."}</span>
              <MessageCircle size={18} className="text-muted-foreground/60" />
            </button>
          </div>
        </div>
      )}

      <UpdatePostModal 
        post={post} 
        isOpen={isUpdateModalOpen} 
        onClose={() => setIsUpdateModalOpen(false)} 
        onPostUpdated={onPostUpdated || (() => {})} 
      />
    </div>
  );
}
