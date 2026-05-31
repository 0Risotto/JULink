"use client";

import React, { useState, useEffect, useRef } from "react";
import { Coffee, Code, Sparkles, BookOpen, Briefcase, ExternalLink, ArrowRight, Flag } from "lucide-react";
import { MOCK_ADS } from "../constants";
import { cn } from "@/lib/utils";
import ReportDialog from "@/domain/report/components/ReportDialog";

interface AdCarouselProps {
  className?: string;
  autoPlayInterval?: number; // in milliseconds
}

const getIcon = (name: string) => {
  switch (name) {
    case "Coffee":
      return <Coffee className="h-5 w-5 text-white/90" />;
    case "Code":
      return <Code className="h-5 w-5 text-white/90" />;
    case "Sparkles":
      return <Sparkles className="h-5 w-5 text-white/90" />;
    case "BookOpen":
      return <BookOpen className="h-5 w-5 text-white/90" />;
    case "Briefcase":
      return <Briefcase className="h-5 w-5 text-white/90" />;
    default:
      return <Sparkles className="h-5 w-5 text-white/90" />;
  }
};

export default function AdCarousel({ className, autoPlayInterval = 4000 }: AdCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % MOCK_ADS.length);
    }, autoPlayInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, autoPlayInterval]);

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  const currentAd = MOCK_ADS[currentIndex];

  if (!currentAd) return null;

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden shadow-md border border-border transition-all duration-300",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Gradient with Transition */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-95 transition-all duration-500",
          currentAd.gradient
        )}
      />

      {/* Decorative background grid pattern for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 p-5 flex flex-col justify-between h-full min-h-[175px] text-white">
        {/* Header: Icon & Sponsored Tag */}
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
            {getIcon(currentAd.iconName)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-white/60 bg-black/25 px-2 py-0.5 rounded-full">
              Sponsored
            </span>
            <ReportDialog
              targetType="AD"
              targetId={currentAd.id}
              trigger={
                <button 
                  className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                  title="Report Ad"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Flag className="h-3.5 w-3.5" />
                </button>
              }
            />
          </div>
        </div>

        {/* Body: Title & Description */}
        <div className="my-3 flex-1 flex flex-col justify-center">
          <h4 className="font-bold text-base tracking-tight mb-1 text-white flex items-center gap-1.5 leading-snug">
            {currentAd.title}
          </h4>
          <p className="text-xs text-white/80 line-clamp-3 leading-relaxed">
            {currentAd.description}
          </p>
        </div>

        {/* Footer: CTA & Indicators */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
          {/* Bullet Indicators */}
          <div className="flex gap-1.5">
            {MOCK_ADS.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => handleDotClick(idx, e)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === currentIndex ? "w-3 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
                )}
                aria-label={`Go to ad ${idx + 1}`}
              />
            ))}
          </div>

          {/* CTA Button */}
          <a
            href={currentAd.link}
            target={currentAd.link.startsWith("http") ? "_blank" : "_self"}
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-white text-gray-900 hover:bg-white/90 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            <span>{currentAd.ctaText}</span>
            {currentAd.link.startsWith("http") ? (
              <ExternalLink className="h-3 w-3" />
            ) : (
              <ArrowRight className="h-3 w-3" />
            )}
          </a>
        </div>
      </div>
    </div>
  );
}
