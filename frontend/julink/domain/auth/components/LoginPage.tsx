"use client";

import Image from "next/image";
import { LoginCard } from "./LoginCard";
import YouTubeEmbed from "@/components/common/youtube/YoutubeFrame";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side */}
      <div className="hidden lg:flex flex-col justify-center px-20 space-y-6 bg-muted/40">
        <Image src="/icons/julink_logo.svg" alt="JULink logo" width={160} height={160} className="w-40 h-auto" />

        <p className="max-w-md text-lg text-justify">
          A social platform created by students at the University of Jordan to
          enhance communication and collaboration within the university
          community.
        </p>

        <YouTubeEmbed videoId="UZl_0maRuvY" width="500" height="350" />
      </div>

      {/* Right Side */}
      <div className="flex items-center justify-center p-6">
        <LoginCard />
      </div>
    </div>
  );
}
