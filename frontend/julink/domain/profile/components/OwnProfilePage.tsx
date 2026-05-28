"use client";

import { useEffect } from "react";
import OwnUserCard from "./OwnUserCard";
import { useUser } from "../hooks/useUser";
import { Spinner } from "@/components/ui/spinner";
import UserPosts from "@/domain/posts/components/UserPosts";
import { Grid, Bookmark } from "lucide-react";

import { useState } from "react";

export default function OwnProfilePage() {
  const [activeTab, setActiveTab] = useState<"posts" | "favorites">("posts");
  const { 
    currentUser, 
    loading, 
    loadMyProfile, 
  } = useUser();
  
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      loadMyProfile()
        .finally(() => setHasFetched(true))
        .catch((err) => {
          console.error("Failed to load my profile:", err);
        });
    } else {
      setHasFetched(true);
    }
  }, [currentUser, loadMyProfile]);

  if (loading || !hasFetched || !currentUser) {
    return (
      <div className="container mx-auto py-8">
        <div className="w-full text-center py-20">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <OwnUserCard user={currentUser} />
      
      {/* Tabs Header */}
      <div className="flex justify-center mt-8">
        <div className="flex gap-12">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-2 pb-4 px-2 text-sm font-semibold tracking-wider uppercase border-b-2 transition-all ${
              activeTab === "posts"
                ? "border-black dark:border-white text-black dark:text-white"
                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <Grid className="w-4 h-4" />
            Posts
          </button>
          
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex items-center gap-2 pb-4 px-2 text-sm font-semibold tracking-wider uppercase border-b-2 transition-all ${
              activeTab === "favorites"
                ? "border-black dark:border-white text-black dark:text-white"
                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Saved
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "posts" ? (
          <UserPosts 
            username={currentUser.username} 
            isOwnProfile={true} 
            currentUser={currentUser} 
            feedType="posts"
          />
        ) : (
          <UserPosts 
            username={currentUser.username} 
            isOwnProfile={true} 
            currentUser={currentUser} 
            feedType="favorites"
          />
        )}
      </div>
    </div>
  );
}
