"use client";

import React, { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface MediaRendererProps {
  attachmentUrl: string;
  attachmentType: string;
  className?: string;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export default function MediaRenderer({ attachmentUrl, attachmentType, className = "", onDoubleClick }: MediaRendererProps) {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  if (attachmentType === "VIDEO" || attachmentUrl.match(/\.(mp4|webm|ogg)$/i)) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black group" onDoubleClick={onDoubleClick}>
        <video
          ref={videoRef}
          src={attachmentUrl}
          className={`w-full h-full object-contain ${className}`}
          autoPlay
          loop
          muted={isMuted}
          playsInline
        />
        {/* Mute/Unmute Toggle Button */}
        <button
          onClick={toggleMute}
          className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    );
  }

  return (
    <img 
      src={attachmentUrl} 
      alt="Post attachment" 
      className={`w-full h-full ${className}`}
      loading="lazy"
      onDoubleClick={onDoubleClick}
    />
  );
}
