import React from "react";
import Link from "next/link";

export const renderHashtags = (text: string) => {
  if (!text) return "";

  // Matches hashtag tokens (words starting with #)
  const regex = /(#\w+)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith("#")) {
      const hashtagName = part.substring(1);
      return (
        <Link
          key={index}
          href={`/search?q=${encodeURIComponent(hashtagName)}&tab=hashtags`}
          className="text-blue-500 hover:underline font-medium"
          onClick={(e) => e.stopPropagation()} // Prevent card double clicks or navigations
        >
          {part}
        </Link>
      );
    }
    return part;
  });
};
