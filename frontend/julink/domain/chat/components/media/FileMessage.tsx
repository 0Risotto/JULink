"use client";

import { FileIcon, Download } from "lucide-react";

interface FileMessageProps {
  url: string;
  filename: string;
  sizeStr: string;
}

export function FileMessage({ url, filename, sizeStr }: FileMessageProps) {
  const isPdf = filename.toLowerCase().endsWith(".pdf");

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 mb-2 rounded-lg bg-background/40 hover:bg-background/60 transition-colors border max-w-[250px] sm:max-w-[300px] group"
    >
      <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <FileIcon className="w-5 h-5" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium truncate" title={filename}>
          {filename}
        </span>
        <span className="text-xs text-muted-foreground uppercase">
          {isPdf ? "PDF Document" : "File Attachment"} {sizeStr && `• ${sizeStr}`}
        </span>
      </div>
      <div className="w-8 h-8 rounded-full bg-background/80 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Download className="w-4 h-4 text-foreground" />
      </div>
    </a>
  );
}
