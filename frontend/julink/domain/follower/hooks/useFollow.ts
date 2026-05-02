import { useState, useCallback } from "react";
import * as FollowerServices from "../services/followerServices";

export const useFollow = (username: string) => {
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingsCount, setFollowingsCount] = useState<number>(0);
  const [mutualFollowers, setMutualFollowers] = useState<string[]>([]);
  const [mutualCount, setMutualCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchFollowData = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const [followingRes, followersRes, followingsListRes, mutualRes] = await Promise.all([
        FollowerServices.getIsFollowing(username),
        FollowerServices.getFollowers(username, 0, 1),
        FollowerServices.getFollowings(username, 0, 1),
        FollowerServices.getMutualFollowers(username, 0, 3) // Fetch top 3 for preview
      ]);

      if (followingRes.status === "success") {
        setIsFollowing(!!followingRes.following);
      }
      
      if (followersRes.status === "success") {
        setFollowersCount(followersRes.totalElements || 0);
      }
      
      if (followingsListRes.status === "success") {
        setFollowingsCount(followingsListRes.totalElements || 0);
      }

      if (mutualRes.status === "success") {
        setMutualFollowers(mutualRes.mutualFollowers || []);
        setMutualCount(mutualRes.totalElements || 0);
      }
    } catch (error) {
      console.error("Failed to fetch follow data:", error);
    } finally {
      setLoading(false);
    }
  }, [username]);

  const toggleFollow = async () => {
    if (!username) return;
    
    const wasFollowing = isFollowing;
    // Optimistic update
    setIsFollowing(!wasFollowing);
    setFollowersCount(prev => wasFollowing ? prev - 1 : prev + 1);
    
    try {
      if (wasFollowing) {
        await FollowerServices.unfollowUser(username);
      } else {
        await FollowerServices.followUser(username);
      }
    } catch (error) {
      // Revert on failure
      setIsFollowing(wasFollowing);
      setFollowersCount(prev => wasFollowing ? prev + 1 : prev - 1);
      console.error("Failed to toggle follow status:", error);
    }
  };

  return {
    isFollowing,
    followersCount,
    followingsCount,
    mutualFollowers,
    mutualCount,
    loading,
    fetchFollowData,
    toggleFollow,
    setFollowersCount,
    setFollowingsCount
  };
};
