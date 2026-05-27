"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { Heart } from "lucide-react";

interface DoubleTapToLikeProps {
  children: ReactNode;
  onDoubleTap: () => void;
  className?: string;
}

export default function DoubleTapToLike({ children, onDoubleTap, className = "" }: DoubleTapToLikeProps) {
  const [showHeart, setShowHeart] = useState(false);

  // We implement custom double-tap to avoid relying solely on onDoubleClick which might not be reliable on all mobile devices
  const [lastTap, setLastTap] = useState(0);

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // It's a double tap
      e.preventDefault();
      onDoubleTap();
      triggerHeartAnimation();
    }
    setLastTap(now);
  };

  const triggerHeartAnimation = () => {
    setShowHeart(true);
    setTimeout(() => {
      setShowHeart(false);
    }, 1000); // 1 second animation duration
  };

  return (
    <div 
      className={`relative cursor-pointer select-none ${className}`} 
      onClick={handleTap}
    >
      {children}

      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-out fade-out duration-1000 zoom-out-50">
          <Heart 
            className="text-white fill-white drop-shadow-2xl scale-150 animate-in zoom-in-50 duration-200" 
            size={100} 
            strokeWidth={0}
          />
        </div>
      )}
    </div>
  );
}
