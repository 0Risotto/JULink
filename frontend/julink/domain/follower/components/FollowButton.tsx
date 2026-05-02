"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import * as FollowerServices from "../services/followerServices";

interface FollowButtonProps {
  username: string;
  initialIsFollowing?: boolean;
  onToggle?: (isFollowing: boolean) => void;
  className?: string;
}

export default function FollowButton({ 
  username, 
  initialIsFollowing, 
  onToggle,
  className 
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState<boolean>(initialIsFollowing || false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialIsFollowing === undefined) {
      // Fetch initial state if not provided
      FollowerServices.getIsFollowing(username)
        .then(res => {
          if (res.status === "success") {
            setIsFollowing(!!res.following);
          }
        })
        .catch(err => console.error("Failed to fetch follow status:", err));
    } else {
      setIsFollowing(initialIsFollowing);
    }
  }, [username, initialIsFollowing]);

  const handleToggle = async () => {
    if (loading) return;
    
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    if (onToggle) onToggle(!wasFollowing);
    setLoading(true);
    
    try {
      if (wasFollowing) {
        await FollowerServices.unfollowUser(username);
      } else {
        await FollowerServices.followUser(username);
      }
    } catch (error) {
      setIsFollowing(wasFollowing);
      if (onToggle) onToggle(wasFollowing);
      console.error("Failed to toggle follow status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant={isFollowing ? "outline" : "default"} 
      onClick={handleToggle}
      disabled={loading}
      className={className}
      size="sm"
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
