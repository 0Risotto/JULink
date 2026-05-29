"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Paperclip, Send, X, Mic, Square, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as chatApi from "../api/chatApi";
import { MessageResponse } from "../types";

interface MessageInputProps {
  conversationId: number;
  onSendTyping: (isTyping: boolean) => void;
  onSendMessage: (content: string) => void;
  editingMessage?: MessageResponse | null;
  onCancelEdit?: () => void;
}

export default function MessageInput({ conversationId, onSendTyping, onSendMessage, editingMessage, onCancelEdit }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (editingMessage && editingMessage.messageType === "TEXT") {
      setContent(editingMessage.content || "");
    } else {
      setContent("");
    }
  }, [editingMessage]);

  useEffect(() => {
    // Dynamic auto-grow calculation
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // Typing indicator logic
    onSendTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onSendTyping(false);
    }, 2000);
  };

  const handleSend = async () => {
    if (!content.trim() && !file) return;

    if (editingMessage) {
      if (content.trim() && content.trim() !== editingMessage.content) {
        try {
          await chatApi.editMessage(editingMessage.id, content.trim());
        } catch (err) {
          console.error("Failed to edit message:", err);
        }
      }
      setContent("");
      onCancelEdit?.();
      return;
    }

    if (file) {
      try {
        setIsUploading(true);
        await chatApi.sendMediaMessage(conversationId, file);
        setFile(null);
      } catch (err) {
        console.error("Failed to send file:", err);
      } finally {
        setIsUploading(false);
      }
    }

    if (content.trim()) {
      onSendMessage(content.trim());
      setContent("");
      onSendTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // Use .mp3 extension and audio/mpeg type so the backend recognizes it as AUDIO
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.mp3`, { type: "audio/mpeg" });
        setFile(audioFile);
        
        // Stop all audio tracks to turn off the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col border-t p-3 bg-background relative select-none shrink-0">
      {editingMessage && (
        <div className="absolute -top-10 left-0 w-full px-4 py-2 bg-primary/10 text-xs flex justify-between items-center text-primary border-t border-b border-primary/15 backdrop-blur-md z-10 animate-in slide-in-from-bottom-2 duration-200">
          <span className="font-semibold">Editing Message</span>
          <button onClick={onCancelEdit} className="hover:opacity-80 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {file && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-secondary/80 border rounded-xl text-xs w-fit animate-in zoom-in-95 duration-150">
          <Paperclip className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate max-w-[180px] font-medium text-foreground">{file.name}</span>
          <Button variant="ghost" size="icon" className="w-6 h-6 ml-1 rounded-full hover:bg-muted" onClick={() => setFile(null)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
      
      <div className="flex items-end gap-2 max-w-full">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        />
        
        {/* Attachment button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isUploading}
          className="h-10 w-10 rounded-full hover:bg-muted/70 text-primary hover:text-primary shrink-0 mb-0.5"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Text Area capsule */}
        <div className="flex-1 flex items-end gap-2 bg-muted/40 border border-border/10 focus-within:border-primary/45 focus-within:bg-background rounded-2xl px-3 py-1.5 transition-all duration-200 max-w-full min-w-0">
     

          {isRecording ? (
            <div className="flex-1 flex items-center justify-between px-2 py-1.5 h-9 bg-destructive/10 text-destructive rounded-lg border border-destructive/15 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                <span className="text-xs font-semibold">Recording {formatTime(recordingTime)}</span>
              </div>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              rows={1}
              value={content}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={isUploading ? "Uploading file..." : "Message..."}
              className="flex-1 max-h-[120px] bg-transparent border-0 outline-none resize-none py-1 text-sm font-sans placeholder:text-muted-foreground/80 leading-relaxed max-w-full focus:ring-0 focus-visible:ring-0 text-foreground"
              disabled={isUploading}
            />
          )}
        </div>
        
        {/* Send / Mic buttons */}
        {isRecording ? (
          <Button onClick={stopRecording} variant="destructive" size="icon" className="h-10 w-10 rounded-full shadow-md shrink-0 mb-0.5">
            <Square className="w-4.5 h-4.5" />
          </Button>
        ) : content.trim() || file || editingMessage ? (
          <Button 
            onClick={handleSend} 
            disabled={isUploading} 
            className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shrink-0 mb-0.5 flex items-center justify-center"
          >
            {isUploading ? (
              <span className="animate-spin w-4.5 h-4.5 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </Button>
        ) : (
          <Button 
            onClick={startRecording} 
            variant="ghost" 
            size="icon" 
            disabled={isUploading}
            className="h-10 w-10 rounded-full hover:bg-muted/70 text-primary hover:text-primary shrink-0 mb-0.5"
          >
            <Mic className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
