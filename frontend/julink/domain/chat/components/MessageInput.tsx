"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Paperclip, Send, X, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    <div className="flex flex-col border-t p-3 bg-card relative">
      {editingMessage && (
        <div className="absolute -top-10 left-0 w-full px-4 py-2 bg-accent text-xs flex justify-between items-center text-muted-foreground shadow-sm">
          <span>Editing Message</span>
          <button onClick={onCancelEdit} className="hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {file && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-accent rounded-md text-sm w-fit">
          <Paperclip className="w-4 h-4" />
          <span className="truncate max-w-[200px]">{file.name}</span>
          <Button variant="ghost" size="icon" className="w-6 h-6 ml-2" onClick={() => setFile(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        />
        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          <Paperclip className="w-5 h-5" />
        </Button>
        
        {isRecording ? (
          <div className="flex-1 flex items-center justify-between px-3 h-10 bg-destructive/10 text-destructive rounded-md border border-destructive/20 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-sm font-medium">Recording {formatTime(recordingTime)}</span>
            </div>
          </div>
        ) : (
          <Input
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={isUploading ? "Uploading file..." : "Type a message..."}
            className="flex-1"
            disabled={isUploading}
          />
        )}
        
        {isRecording ? (
          <Button onClick={stopRecording} variant="destructive" size="icon">
            <Square className="w-4 h-4" />
          </Button>
        ) : content.trim() || file || editingMessage ? (
          <Button onClick={handleSend} disabled={isUploading}>
            {isUploading ? <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> : <Send className="w-4 h-4" />}
          </Button>
        ) : (
          <Button onClick={startRecording} variant="ghost" size="icon" disabled={isUploading}>
            <Mic className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
