"use client";

import Image from "next/image";
import { LoginCard } from "./LoginCard";
import YouTubeEmbed from "@/components/common/youtube/YoutubeFrame";
import julinkLogo from "@assets/icons/julink_logo.svg";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side */}
      <div className="hidden lg:flex flex-col justify-center items-center px-10 space-y-6 bg-muted/40">
        <div className="flex flex-col items-start max-w-md space-y-6">
          <Image
            src={julinkLogo}
            alt="JULink logo"
            width={160}
            height={160}
            className="w-40 h-auto"
          />
          <div className="pt-1 space-y-3">
            <p className="max-w-md text-lg  text-justify">
              A social platform created by students at the University of Jordan
              to enhance communication and collaboration within the university
              community.
            </p>

            <YouTubeEmbed videoId="UZl_0maRuvY" width="450" height="350" />
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className=" flex flex-1 flex-col items-center justify-center min-h-screen lg:min-h-0 ">
        <div className="lg:hidden mv-5">
          <Image src={julinkLogo} alt="JULink logo" className="w-50 h-auto" />
        </div>
        <div className="w-full flex items-center justify-center p-6">
          <LoginCard />
        </div>
      </div>
    </div>
  );
}
