// ownProfile/hooks/useUser.tsx
"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchMyUsername,
  fetchMyProfile,
  fetchUserProfile,
  updateProfile,
  clearUserError,
  clearViewedUser,
  updateCurrentUserLocally,
} from "../store/userSlice";
import { UpdateProfileDTO } from "../types";

export const useUser = () => {
  const dispatch = useAppDispatch();
  
  const { myUsername, currentUser, viewedUser, loading, error } = useAppSelector(
    (state) => state.user
  );

  const loadMyUsername = useCallback(async () => {
    return dispatch(fetchMyUsername()).unwrap();
  }, [dispatch]);

  const loadMyProfile = useCallback(async () => {
    return dispatch(fetchMyProfile()).unwrap();
  }, [dispatch]);

  const loadUserProfile = useCallback(
    async (username: string) => {
      return dispatch(fetchUserProfile(username)).unwrap();
    },
    [dispatch]
  );

  const updateUserProfile = useCallback(
    async (data: UpdateProfileDTO) => {
      return dispatch(updateProfile(data)).unwrap();
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearUserError());
  }, [dispatch]);

  const clearProfile = useCallback(() => {
    dispatch(clearViewedUser());
  }, [dispatch]);

  const updateLocally = useCallback(
    (data: Partial<UpdateProfileDTO>) => {
      dispatch(updateCurrentUserLocally(data));
    },
    [dispatch]
  );

  return {
    // State
    myUsername,
    currentUser,
    viewedUser,
    loading,
    error,
    
    // Actions
    loadMyUsername,
    loadMyProfile,
    loadUserProfile,
    updateUserProfile,
    clearError,
    clearProfile,
    updateLocally,
  };
};