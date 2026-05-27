"use client";

import React, { useRef, useState, useEffect } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

interface MediaRendererProps {
  attachmentUrl: string;
  attachmentType: string;
  className?: string;
  onDoubleClick?: (e: React.MouseEvent) => void;
  isModalOpen?: boolean;
}

export default function MediaRenderer({ attachmentUrl, attachmentType, className = "", onDoubleClick, isModalOpen = false }: MediaRendererProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to pause video if modal is open (so background video stops playing)
  useEffect(() => {
    if (videoRef.current) {
      if (isModalOpen) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else if (!isModalOpen && containerRef.current) {
        // If modal closes, let the intersection observer handle if it should play or not.
        // We will just let the intersection observer handle play/pause by re-evaluating.
      }
    }
  }, [isModalOpen]);

  // Intersection Observer to auto-pause when out of view
  useEffect(() => {
    if (attachmentType !== "VIDEO" && !attachmentUrl.match(/\.(mp4|webm|ogg)$/i)) return;

    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.5, // Video must be at least 50% visible to play
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (videoRef.current) {
          // Only play if intersecting AND the modal is NOT open
          if (entry.isIntersecting && !isModalOpen) {
            videoRef.current.play().catch(e => console.log("Autoplay prevented", e));
            setIsPlaying(true);
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      });
    }, options);

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [attachmentType, attachmentUrl, isModalOpen]);

  // Handle click to play/pause
  const handleClick = (e: React.MouseEvent) => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        // Show pause icon briefly
        setShowPlayIcon(true);
      } else {
        videoRef.current.play().catch(e => console.log("Play prevented", e));
        setIsPlaying(true);
        // Show play icon briefly
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 1000);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  if (attachmentType === "VIDEO" || attachmentUrl.match(/\.(mp4|webm|ogg)$/i)) {
    return (
      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center bg-black group cursor-pointer" 
        onDoubleClick={onDoubleClick}
        onClick={handleClick}
      >
        <video
          ref={videoRef}
          src={attachmentUrl}
          className={`w-full h-full object-contain ${className}`}
          autoPlay
          loop
          muted={isMuted}
          playsInline
        />
        
        {/* Center Play/Pause Icon Overlay */}
        {(showPlayIcon || !isPlaying) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300">
            <div className="bg-black/50 rounded-full p-4 text-white">
              {isPlaying ? <Play size={40} className="fill-white" /> : <Play size={40} className="fill-white" />}
            </div>
          </div>
        )}

        {/* Mute/Unmute Toggle Button */}
        <button
          onClick={toggleMute}
          className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100 pointer-events-auto z-10"
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
      className={`w-full h-full ${className} pointer-events-none`}
      loading="lazy"
      onDoubleClick={onDoubleClick}
    />
  );
}
