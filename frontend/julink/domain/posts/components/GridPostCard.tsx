"use client";

import React from "react";
import { PostResponseDTO } from "../types";
import { FileText, Image as ImageIcon, Video } from "lucide-react";

interface GridPostCardProps {
  post: PostResponseDTO;
  onClick: () => void;
}

export default function GridPostCard({ post, onClick }: GridPostCardProps) {
  // Determine what to show in the grid thumbnail
  const hasAttachments = post.attachments && post.attachments.length > 0;
  const firstAttachment = hasAttachments ? post.attachments[0] : null;

  return (
    <div 
      onClick={onClick} 
      className="aspect-square relative group cursor-pointer overflow-hidden rounded-md bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800"
    >
      {/* Thumbnail Content */}
      {hasAttachments && firstAttachment ? (
        firstAttachment.attachmentType === "VIDEO" || firstAttachment.attachmentUrl.match(/\.(mp4|webm|ogg)$/i) ? (
          <video 
            src={firstAttachment.attachmentUrl} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            muted
            playsInline
            loop
            autoPlay
          />
        ) : (
          <img 
            src={firstAttachment.attachmentUrl} 
            alt="Post thumbnail" 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
          <p className="text-sm font-medium line-clamp-4 overflow-hidden break-words w-full px-2">
            {post.description}
          </p>
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white">
        <div className="flex gap-4 font-semibold text-lg drop-shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="text-white text-xl">♥</span> {post.likesCount}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white text-xl">💬</span> {post.commentsCount}
          </div>
        </div>
      </div>

      {/* Top right indicator for type of post */}
      <div className="absolute top-2 right-2 drop-shadow-md">
         {hasAttachments ? (
            firstAttachment?.attachmentType === "VIDEO" || firstAttachment?.attachmentUrl.match(/\.(mp4|webm|ogg)$/i) ? (
              <Video size={18} className="text-white fill-current opacity-80" />
            ) : post.attachments.length > 1 ? (
              <ImageIcon size={18} className="text-white fill-current opacity-80" />
            ) : null
         ) : (
           <FileText size={18} className="text-gray-500 opacity-60" />
         )}
      </div>
    </div>
  );
}
