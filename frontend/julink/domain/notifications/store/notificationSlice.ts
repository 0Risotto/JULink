import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { NotificationResponse } from "../types";
import * as notificationApi from "../services/notificationService";

interface NotificationState {
  notifications: NotificationResponse[];
  unreadCount: number;
  loadingNotifications: boolean;
  hasMore: boolean;
  page: number;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loadingNotifications: false,
  hasMore: true,
  page: 0,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async ({ page = 0, size = 10, reset = false }: { page?: number; size?: number; reset?: boolean }, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getNotifications(page, size);
      return { data: response, reset };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch notifications");
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getUnreadCount();
      return response.unreadCount;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch unread count");
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId: string, { rejectWithValue }) => {
    try {
      return await notificationApi.markAsRead(notificationId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to mark notification as read");
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      await notificationApi.markAllAsRead();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to mark all notifications as read");
    }
  }
);

export const deleteNotificationAction = createAsyncThunk(
  "notifications/deleteNotification",
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete notification");
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    newNotificationReceived: (state, action: PayloadAction<NotificationResponse>) => {
      // Prevent duplicates in the notifications array
      const exists = state.notifications.some((n) => n.id === action.payload.id);
      if (!exists) {
        state.notifications.unshift(action.payload);
        state.unreadCount += 1;
      }
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.pending, (state) => {
      state.loadingNotifications = true;
      state.error = null;
    });
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      const { data, reset } = action.payload;
      state.loadingNotifications = false;
      state.hasMore = !data.last;
      state.page = data.number;

      if (reset) {
        state.notifications = data.content;
      } else {
        // Prevent duplicate items when joining pages
        const existingIds = new Set(state.notifications.map((n) => n.id));
        const filteredNew = data.content.filter((n) => !existingIds.has(n.id));
        state.notifications.push(...filteredNew);
      }
    });
    builder.addCase(fetchNotifications.rejected, (state, action) => {
      state.loadingNotifications = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload;
    });

    builder.addCase(markNotificationAsRead.fulfilled, (state, action) => {
      const updated = action.payload;
      const index = state.notifications.findIndex((n) => n.id === updated.id);
      if (index !== -1) {
        // If it changed from unread to read, decrement count
        if (!state.notifications[index].read && updated.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications[index] = updated;
      } else {
        // If not found in current loaded list, just decrement count (assuming it was unread)
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });

    builder.addCase(markAllNotificationsAsRead.fulfilled, (state) => {
      state.unreadCount = 0;
      state.notifications = state.notifications.map((n) => ({
        ...n,
        read: true,
      }));
    });

    builder.addCase(deleteNotificationAction.fulfilled, (state, action) => {
      const id = action.payload;
      const notification = state.notifications.find((n) => n.id === id);
      if (notification && !notification.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter((n) => n.id !== id);
    });
  },
});

export const { newNotificationReceived, setUnreadCount } = notificationSlice.actions;
export default notificationSlice.reducer;
