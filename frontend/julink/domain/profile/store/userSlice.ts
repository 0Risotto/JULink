// ownProfile/store/index.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { UserProfileDTO, UpdateProfileDTO } from "../types";
import { getMyProfile, getUserProfile, updateMyProfile, getMyUsername } from "../services/profileServices";

interface UserState {
  myUsername: string | null;
  currentUser: UserProfileDTO | null;
  viewedUser: UserProfileDTO | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  myUsername: null,
  currentUser: null,
  viewedUser: null,
  loading: false,
  error: null,
};

export const fetchMyUsername = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>("user/fetchMyUsername", async (_, { rejectWithValue }) => {
  try {
    const response = await getMyUsername();
    
    if (response.Status?.toLowerCase() !== "success" || !response.username) {
      return rejectWithValue(response.Status || "Failed to fetch username");
    }
    
    return response.username;
  } catch (error) {
    return rejectWithValue("Server error while fetching username");
  }
});

export const fetchMyProfile = createAsyncThunk<
  UserProfileDTO,
  void,
  { rejectValue: string }
>("user/fetchMyProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await getMyProfile();
    
    if (response.status?.toLowerCase() !== "success" || !response.user) {
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
    
    if (response.status?.toLowerCase() !== "success" || !response.user) {
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
    
    if (response.status?.toLowerCase() !== "success" || !response.user) {
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
      // Fetch my username
      .addCase(fetchMyUsername.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyUsername.fulfilled, (state, action) => {
        state.loading = false;
        state.myUsername = action.payload;
      })
      .addCase(fetchMyUsername.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch username";
      })
      
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