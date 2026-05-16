"use client";

interface ImageMessageProps {
  url: string;
  filename: string;
}

export function ImageMessage({ url, filename }: ImageMessageProps) {
  return (
    <div className="relative group mb-2 overflow-hidden rounded-md max-w-[250px] sm:max-w-[300px]">
      <img
        src={url}
        alt={filename}
        className="w-full h-auto object-cover max-h-[300px] cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => window.open(url, "_blank")}
      />
    </div>
  );
}
