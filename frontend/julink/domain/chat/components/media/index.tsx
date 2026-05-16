"use client";

import { MessageResponse } from "../../types";
import { ImageMessage } from "./ImageMessage";
import { VideoMessage } from "./VideoMessage";
import { AudioMessage } from "./AudioMessage";
import { FileMessage } from "./FileMessage";

export default function MessageMedia({ msg }: { msg: MessageResponse }) {
  if (!msg.mediaUrl) return null;

  const url = msg.mediaUrl;
  const filename = msg.mediaFilename || "Attachment";
  const type = msg.messageType;
  
  const formatSize = (bytes?: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const sizeStr = formatSize(msg.mediaSizeBytes);

  switch (type) {
    case "IMAGE":
      return <ImageMessage url={url} filename={filename} />;
    case "VIDEO":
      return <VideoMessage url={url} />;
    case "AUDIO":
      return <AudioMessage url={url} />;
    case "FILE":
    default:
      return <FileMessage url={url} filename={filename} sizeStr={sizeStr} />;
  }
}
