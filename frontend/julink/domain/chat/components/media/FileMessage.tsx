"use client";

import { FileIcon, Download } from "lucide-react";

interface FileMessageProps {
  url: string;
  filename: string;
  sizeStr: string;
  isMe?: boolean;
}

export function FileMessage({ url, filename, sizeStr, isMe }: FileMessageProps) {
  const isPdf = filename.toLowerCase().endsWith(".pdf");

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-2 rounded-lg transition-colors border max-w-[250px] sm:max-w-[300px] group m-1 ${
        isMe 
          ? "bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/20 text-primary-foreground" 
          : "bg-background/40 hover:bg-background/60 border-border text-foreground"
      }`}
    >
      <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${
        isMe ? "bg-primary-foreground text-primary" : "bg-primary/10 text-primary"
      }`}>
        <FileIcon className="w-5 h-5" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium truncate" title={filename}>
          {filename}
        </span>
        <span className={`text-xs uppercase ${isMe ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          {isPdf ? "PDF Document" : "File Attachment"} {sizeStr && `• ${sizeStr}`}
        </span>
      </div>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
        isMe ? "bg-primary-foreground/20" : "bg-background/80"
      }`}>
        <Download className="w-4 h-4" />
      </div>
    </a>
  );
}
