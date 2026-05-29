"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfileDTO } from "../types";
import { Colleges } from "@/domain/auth/types";
import { useFollow } from "@/domain/follower/hooks/useFollow";
import FollowButton from "@/domain/follower/components/FollowButton";
import FollowListDialog from "@/domain/follower/components/FollowListDialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setActiveConversation } from "@/domain/chat/store/chatSlice";
import * as chatApi from "@/domain/chat/api/chatApi";
import * as FollowerServices from "@/domain/follower/services/followerServices";
import { useBlock } from "@/domain/block/hooks/useBlock";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ShieldAlert } from "lucide-react";

interface ViewedUserCardProps {
  user: UserProfileDTO;
}

export default function ViewedUserCard({ user }: ViewedUserCardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isMutual, setIsMutual] = useState(false);
  const { block } = useBlock();

  const handleBlockUser = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to block @${user.username}? They will no longer be able to see your posts or message you.`
    );
    if (!confirmed) return;

    const success = await block(user.username);
    if (success) {
      router.push("/settings");
    } else {
      alert("Failed to block user. Please try again.");
    }
  };

  const {
    isFollowing,
    followersCount,
    followingsCount,
    mutualFollowers,
    mutualCount,
    fetchFollowData,
    toggleFollow
  } = useFollow(user.username);

  useEffect(() => {
    fetchFollowData();
  }, [fetchFollowData]);

  useEffect(() => {
    FollowerServices.getIsMutual(user.username)
      .then((res) => {
        if (res.status === "success") {
          setIsMutual(res.mutual || false);
        }
      })
      .catch((err) => console.error("Failed to fetch mutual follow status", err));
  }, [user.username, isFollowing]);

  const handleSendMessage = async () => {
    try {
      const conv = await chatApi.createDM(user.username);
      dispatch(setActiveConversation(conv.id));
      router.push("/chat");
    } catch (err) {
      console.error("Failed to open DM", err);
    }
  };

  return (
    <div className="w-full flex flex-col border-b rounded-t-3xl overflow-hidden bg-background">
      {/* Banner */}
      <div
        className="w-full h-40 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${user.bannerPhoto})` }}
      >
        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="flex items-start gap-6 py-6 px-4">
        <Avatar className="w-24 h-24 -mt-12 border-0 border-white">
          <AvatarImage src={user.profilePicture || undefined} />
          <AvatarFallback>
            {user.firstName?.[0]}{user.lastName?.[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2 flex-grow">
          {/* Username + Follow Button */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{user.username}</h1>
            <div className="flex items-center gap-2">
              {isMutual && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSendMessage}
                >
                  Send Message
                </Button>
              )}              
              <FollowButton 
                username={user.username} 
                initialIsFollowing={isFollowing} 
                onToggle={toggleFollow} 
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={handleBlockUser}
                    className="text-red-500 hover:text-red-600 cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Block User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <p>
              <span className="font-bold">{user.postsNumber || 0}</span> Posts
            </p>

            <FollowListDialog
              title="Followers"
              username={user.username}
              type="followers"
              trigger={
                <p className="cursor-pointer">
                  <span className="font-bold">{followersCount}</span>{" "}
                  Followers
                </p>
              }
            />

            <FollowListDialog
              title="Following"
              username={user.username}
              type="followings"
              trigger={
                <p className="cursor-pointer">
                  <span className="font-bold">{followingsCount}</span>{" "}
                  Following
                </p>
              }
            />
          </div>

          {/* Full Name & College */}
          <div>
            <p className="font-semibold">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {Colleges[user.college as keyof typeof Colleges] || user.college}
            </p>

            {user.bio && <p className="text-sm mt-1">{user.bio}</p>}
            
            {mutualCount > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {mutualCount} mutual follower{mutualCount > 1 ? "s" : ""}: {mutualFollowers.join(", ")}{mutualCount > mutualFollowers.length ? "..." : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
