"use client";

import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserProfileDTO } from "../types";
import { Colleges } from "@/domain/auth/types";
import { useFollow } from "@/domain/follower/hooks/useFollow";
import FollowListDialog from "@/domain/follower/components/FollowListDialog";
import EditProfileDialog from "./EditProfileDialog";

interface OwnUserCardProps {
  user: UserProfileDTO;
}

export default function OwnUserCard({ user }: OwnUserCardProps) {
  const {
    followersCount,
    followingsCount,
    fetchFollowData,
    setFollowingsCount
  } = useFollow(user.username);

  const handleListFollowChange = (targetUsername: string, isFollowing: boolean) => {
    setFollowingsCount(prev => isFollowing ? prev + 1 : prev - 1);
  };

  useEffect(() => {
    fetchFollowData();
  }, [fetchFollowData]);

  return (
    <div className="w-full flex flex-col border-b">
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
          {/* Username + Edit */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{user.username}</h1>
            <EditProfileDialog user={user}>
              <Button variant="outline">
                Edit Profile
              </Button>
            </EditProfileDialog>
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
              onFollowChange={handleListFollowChange}
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
              onFollowChange={handleListFollowChange}
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
          </div>
        </div>
      </div>
    </div>
  );
}
