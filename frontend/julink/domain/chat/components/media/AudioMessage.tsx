"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioMessageProps {
  url: string;
  isMe?: boolean;
}

export function AudioMessage({ url, isMe }: AudioMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      if (audio.duration && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 w-[200px] sm:w-[240px] p-2">
      <audio ref={audioRef} src={url} preload="metadata" />
      
      <Button
        onClick={togglePlayPause}
        variant="secondary"
        size="icon"
        className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-all shadow-sm ${
          isMe 
            ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90" 
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </Button>
      
      <div className="flex flex-col w-full gap-1">
        <div className={`relative w-full h-2 rounded-full flex items-center group cursor-pointer ${
          isMe ? "bg-primary-foreground/30" : "bg-primary/20"
        }`}>
          <div 
            className={`absolute h-full rounded-full ${isMe ? "bg-primary-foreground" : "bg-primary"}`}
            style={{ width: `${progressPercent}%` }}
          />
          <div 
            className={`absolute w-3 h-3 rounded-full shadow-sm scale-0 group-hover:scale-100 transition-transform origin-center ${
              isMe ? "bg-primary-foreground" : "bg-primary"
            }`}
            style={{ left: `calc(${progressPercent}% - 6px)` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className={`flex justify-between w-full text-[10px] font-medium px-0.5 ${
          isMe ? "text-primary-foreground/80" : "text-muted-foreground"
        }`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
