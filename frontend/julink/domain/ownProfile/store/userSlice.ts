// ownProfile/store/index.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { UserProfileDTO, UpdateProfileDTO } from "../types";
import { getMyProfile, getUserProfile, updateMyProfile } from "../services/profileServices";

interface UserState {
  currentUser: UserProfileDTO | null;
  viewedUser: UserProfileDTO | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  viewedUser: null,
  loading: false,
  error: null,
};

export const fetchMyProfile = createAsyncThunk<
  UserProfileDTO,
  void,
  { rejectValue: string }
>("user/fetchMyProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await getMyProfile();
    
    if (response.status !== "success" || !response.user) {
      return rejectWithValue(response.message || "Failed to fetch profile");
    }
    
    return response.user;
  } catch (error) {
    return rejectWithValue("Server error while fetching profile");
  }
});

export const fetchUserProfile = createAsyncThunk<
  UserProfileDTO,
  string,
  { rejectValue: string }
>("user/fetchUserProfile", async (username, { rejectWithValue }) => {
  try {
    const response = await getUserProfile(username);
    
    if (response.status !== "success" || !response.user) {
      return rejectWithValue(response.message || "Failed to fetch user profile");
    }
    
    return response.user;
  } catch (error) {
    return rejectWithValue("Server error while fetching user profile");
  }
});

export const updateProfile = createAsyncThunk<
  UserProfileDTO,
  UpdateProfileDTO,
  { rejectValue: string }
>("user/updateProfile", async (data, { rejectWithValue }) => {
  try {
    const response = await updateMyProfile(data);
    
    if (response.status !== "success" || !response.user) {
      return rejectWithValue(response.message || "Failed to update profile");
    }
    
    return response.user;
  } catch (error) {
    return rejectWithValue("Server error while updating profile");
  }
});

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    clearViewedUser: (state) => {
      state.viewedUser = null;
    },
    updateCurrentUserLocally: (state, action: PayloadAction<Partial<UserProfileDTO>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch my profile
      .addCase(fetchMyProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchMyProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch profile";
      })
      
      // Fetch user profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.viewedUser = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch user profile";
      })
      
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update profile";
      });
  },
});

export const { clearUserError, clearViewedUser, updateCurrentUserLocally } = userSlice.actions;
export default userSlice.reducer;