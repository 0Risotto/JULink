"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MediaRenderer from "./MediaRenderer";
import { AttachmentResponseDTO } from "../types";

interface PostCarouselProps {
  attachments: AttachmentResponseDTO[];
  isModalOpen?: boolean;
}

export default function PostCarousel({ attachments, isModalOpen }: PostCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < attachments.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="relative w-full aspect-[4/5] md:aspect-square flex items-center justify-center bg-black group select-none">
      <MediaRenderer
        attachmentUrl={attachments[currentIndex].attachmentUrl}
        attachmentType={attachments[currentIndex].attachmentType}
        className="w-full h-full object-contain"
        isModalOpen={isModalOpen}
      />
      
      {attachments.length > 1 && (
        <>
          {/* Left Arrow */}
          {currentIndex > 0 && (
            <button
              onClick={prevSlide}
              type="button"
              className="absolute top-1/2 left-3 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors z-10"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          
          {/* Right Arrow */}
          {currentIndex < attachments.length - 1 && (
            <button
              onClick={nextSlide}
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors z-10"
            >
              <ChevronRight size={20} />
            </button>
          )}
          
          {/* Indicator Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {attachments.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === currentIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
