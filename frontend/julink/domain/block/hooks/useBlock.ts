import { useState, useCallback } from "react";
import * as blockServices from "../services/blockServices";
import { BlockedUser, BlockStatus } from "../types";

export const useBlock = () => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockStatus, setBlockStatus] = useState<BlockStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBlockedUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await blockServices.getBlockedUsers();
      if (response.status === "success") {
        setBlockedUsers(response.blockedUsers || []);
      } else {
        setError(response.message || "Failed to fetch blocked users");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching blocked users");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBlockStatus = useCallback(async (username: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await blockServices.getBlockStatus(username);
      if (response.status === "success" && response.blockStatus) {
        setBlockStatus(response.blockStatus);
        return response.blockStatus;
      } else {
        setError(response.message || "Failed to fetch block status");
        return null;
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching block status");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const block = useCallback(async (username: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await blockServices.blockUser(username);
      if (response.status === "success") {
        // Update local block status state if it was for the blocked user
        setBlockStatus(prev => {
          if (prev) {
            return {
              ...prev,
              blockedByMe: true,
              blockedEitherWay: true,
            };
          }
          return {
            blockedByMe: true,
            blockedMe: false,
            blockedEitherWay: true,
          };
        });
        return true;
      } else {
        setError(response.message || `Failed to block ${username}`);
        return false;
      }
    } catch (err: any) {
      setError(err.message || `An error occurred while blocking ${username}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unblock = useCallback(async (username: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await blockServices.unblockUser(username);
      if (response.status === "success") {
        // Filter out the unblocked user from the local list
        setBlockedUsers(prev => prev.filter(user => user.username !== username));
        
        // Update local block status state if it was for the unblocked user
        setBlockStatus(prev => {
          if (prev) {
            const stillBlocked = prev.blockedMe; // True if other user still blocks me
            return {
              ...prev,
              blockedByMe: false,
              blockedEitherWay: stillBlocked,
            };
          }
          return {
            blockedByMe: false,
            blockedMe: false,
            blockedEitherWay: false,
          };
        });
        return true;
      } else {
        setError(response.message || `Failed to unblock ${username}`);
        return false;
      }
    } catch (err: any) {
      setError(err.message || `An error occurred while unblocking ${username}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    blockedUsers,
    blockStatus,
    loading,
    error,
    fetchBlockedUsers,
    fetchBlockStatus,
    block,
    unblock,
    setBlockedUsers,
    setBlockStatus,
  };
};
