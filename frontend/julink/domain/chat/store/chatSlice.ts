import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ConversationResponse, MessageResponse, Page, WsTypingEvent } from "../types";
import * as chatApi from "../api/chatApi";

interface ChatState {
  conversations: ConversationResponse[];
  activeConversationId: string | null;
  messagesByConvId: Record<string, MessageResponse[]>;
  typingState: Record<string, string[]>; // conversationId -> array of usernames typing
  loadingConversations: boolean;
  loadingMessages: Record<string, boolean>;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  messagesByConvId: {},
  typingState: {},
  loadingConversations: false,
  loadingMessages: {},
  error: null,
};

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      return await chatApi.getConversations();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch conversations");
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ conversationId, page = 0 }: { conversationId: string; page?: number }, { rejectWithValue }) => {
    try {
      const response = await chatApi.getMessages(conversationId, page);
      return { conversationId, page, data: response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch messages");
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;
      if (action.payload && state.conversations.length > 0) {
        const conv = state.conversations.find((c) => c.id === action.payload);
        if (conv) {
          conv.unreadCount = 0;
        }
      }
    },
    wsMessageReceived: (state, action: PayloadAction<{ eventType: string; message: MessageResponse }>) => {
      const { eventType, message } = action.payload;
      const convId = message.conversationId;

      // Ensure conversation exists in messages dictionary
      if (!state.messagesByConvId[convId]) {
        state.messagesByConvId[convId] = [];
      }

      if (eventType === "NEW_MESSAGE") {
        // Append message
        state.messagesByConvId[convId].push(message);
        
        // Update conversation last message & unread count
        const conv = state.conversations.find((c) => c.id === convId);
        if (conv) {
          conv.lastMessage = message;
          conv.updatedAt = message.sentAt;
          if (state.activeConversationId !== convId) {
            conv.unreadCount += 1;
          }
        }
      } else if (eventType === "EDIT_MESSAGE") {
        const msgs = state.messagesByConvId[convId];
        const index = msgs.findIndex((m) => m.id === message.id);
        if (index !== -1) {
          msgs[index] = message;
        }
      } else if (eventType === "DELETE_MESSAGE") {
        const msgs = state.messagesByConvId[convId];
        const index = msgs.findIndex((m) => m.id === message.id);
        if (index !== -1) {
          msgs[index].deleted = true;
          msgs[index].content = null;
        }
      }
    },
    wsTypingReceived: (state, action: PayloadAction<WsTypingEvent>) => {
      const { conversationId, username, typing } = action.payload;
      if (!state.typingState[conversationId]) {
        state.typingState[conversationId] = [];
      }
      
      const typingUsers = state.typingState[conversationId];
      if (typing) {
        if (!typingUsers.includes(username)) {
          typingUsers.push(username);
        }
      } else {
        state.typingState[conversationId] = typingUsers.filter((u) => u !== username);
      }
    },
    wsReadReceived: (state, action: PayloadAction<{ conversationId: string; username: string; lastReadMessageId: string }>) => {
      const { conversationId, lastReadMessageId } = action.payload;
      const msgs = state.messagesByConvId[conversationId];
      if (msgs) {
        const index = msgs.findIndex((message) => message.id === lastReadMessageId);
        if (index !== -1) {
          for (let i = 0; i <= index; i += 1) {
            msgs[i].status = "READ";
          }
        }
      }
    },
    updateConversation: (state, action: PayloadAction<ConversationResponse>) => {
      const updatedConv = action.payload;
      const index = state.conversations.findIndex((c) => c.id === updatedConv.id);
      if (index !== -1) {
        state.conversations[index] = updatedConv;
      } else {
        state.conversations.unshift(updatedConv);
      }
    },
    removeConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter((c) => c.id !== action.payload);
      if (state.activeConversationId === action.payload) {
        state.activeConversationId = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchConversations.pending, (state) => {
      state.loadingConversations = true;
      state.error = null;
    });
    builder.addCase(fetchConversations.fulfilled, (state, action) => {
      state.loadingConversations = false;
      state.conversations = action.payload;
    });
    builder.addCase(fetchConversations.rejected, (state, action) => {
      state.loadingConversations = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchMessages.pending, (state, action) => {
      state.loadingMessages[action.meta.arg.conversationId] = true;
    });
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      const { conversationId, page, data } = action.payload;
      state.loadingMessages[conversationId] = false;
      
      if (page === 0) {
        // Reset messages if it's the first page
        state.messagesByConvId[conversationId] = data.content.reverse(); // reverse since we usually get newest first
      } else {
        // Prepend older messages
        state.messagesByConvId[conversationId] = [...data.content.reverse(), ...(state.messagesByConvId[conversationId] || [])];
      }
    });
    builder.addCase(fetchMessages.rejected, (state, action) => {
      state.loadingMessages[action.meta.arg.conversationId] = false;
    });
  },
});

export const {
  setActiveConversation,
  wsMessageReceived,
  wsTypingReceived,
  wsReadReceived,
  updateConversation,
  removeConversation,
} = chatSlice.actions;

export default chatSlice.reducer;
