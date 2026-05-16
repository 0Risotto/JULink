"use client";

interface VideoMessageProps {
  url: string;
}

export function VideoMessage({ url }: VideoMessageProps) {
  return (
    <div className="mb-2 max-w-[250px] sm:max-w-[300px] overflow-hidden rounded-md bg-black">
      <video
        src={url}
        controls
        className="w-full h-auto max-h-[300px]"
        preload="metadata"
      />
    </div>
  );
}
