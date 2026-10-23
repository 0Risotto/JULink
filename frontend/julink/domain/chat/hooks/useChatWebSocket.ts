import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  wsMessageReceived,
  wsReadReceived,
  wsTypingReceived,
} from "../store/chatSlice";
import { MessageType } from "../types";
import * as chatApi from "../api/chatApi";
import { getWsBaseUrl, getWsTicket } from "@/util/api/axios";

interface ServerFrame {
  type: string;
  conversation_id?: string;
  message?: Parameters<typeof chatApi.mapMessage>[0];
  username?: string;
  typing?: boolean;
  last_read_message_id?: string;
  code?: string;
  message_id?: string;
}

export const useChatWebSocket = (myUsername: string | null) => {
  const dispatch = useAppDispatch();
  const conversations = useAppSelector((state) => state.chat.conversations);
  const socketRef = useRef<WebSocket | null>(null);
  const subscribedRef = useRef<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);

  const sendFrame = useCallback((frame: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(frame));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!myUsername) return;

    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      try {
        const { ticket } = await getWsTicket();
        if (closed) return;

        const socket = new WebSocket(
          `${getWsBaseUrl()}/ws?ticket=${encodeURIComponent(ticket)}`,
        );
        socketRef.current = socket;

        socket.onopen = () => {
          setConnected(true);
          subscribedRef.current.clear();
        };

        socket.onmessage = (event) => {
          let frame: ServerFrame;
          try {
            frame = JSON.parse(event.data as string) as ServerFrame;
          } catch {
            return;
          }

          switch (frame.type) {
            case "message.created":
            case "message.updated":
            case "message.deleted": {
              if (!frame.message) return;
              const message = chatApi.mapMessage(frame.message);
              const eventType =
                frame.type === "message.created"
                  ? "NEW_MESSAGE"
                  : frame.type === "message.updated"
                    ? "EDIT_MESSAGE"
                    : "DELETE_MESSAGE";
              dispatch(wsMessageReceived({ eventType, message }));
              break;
            }
            case "typing":
              if (frame.conversation_id && frame.username != null) {
                dispatch(
                  wsTypingReceived({
                    conversationId: frame.conversation_id,
                    username: frame.username,
                    typing: Boolean(frame.typing),
                  }),
                );
              }
              break;
            case "read.updated":
              if (
                frame.conversation_id &&
                frame.last_read_message_id &&
                frame.username !== myUsername
              ) {
                dispatch(
                  wsReadReceived({
                    conversationId: frame.conversation_id,
                    username: frame.username || "",
                    lastReadMessageId: frame.last_read_message_id,
                  }),
                );
              }
              break;
            case "error":
              console.warn("[realtime]", frame.code, frame.message_id);
              break;
            default:
              break;
          }
        };

        socket.onclose = () => {
          setConnected(false);
          subscribedRef.current.clear();
          socketRef.current = null;
          if (!closed) {
            reconnectTimer = setTimeout(connect, 3000);
          }
        };

        socket.onerror = () => socket.close();
      } catch (error) {
        console.warn("Could not open realtime socket", error);
        if (!closed) reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [dispatch, myUsername]);

  useEffect(() => {
    if (!connected) return;
    for (const conversation of conversations) {
      if (subscribedRef.current.has(conversation.id)) continue;
      if (
        sendFrame({
          type: "subscribe",
          conversation_id: conversation.id,
        })
      ) {
        subscribedRef.current.add(conversation.id);
      }
    }
  }, [connected, conversations, sendFrame]);

  const sendMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      messageType: MessageType = "TEXT",
    ) => {
      const sent = sendFrame({
        type: "send_message",
        conversation_id: conversationId,
        kind: messageType.toLowerCase(),
        body: content,
        client_id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : String(Date.now()),
      });

      if (!sent) {
        const response = await chatApi.sendMessage(
          conversationId,
          content,
          messageType,
        );
        dispatch(
          wsMessageReceived({ eventType: "NEW_MESSAGE", message: response }),
        );
      }
    },
    [dispatch, sendFrame],
  );

  const sendTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      sendFrame({
        type: "typing",
        conversation_id: conversationId,
        typing: isTyping,
      });
    },
    [sendFrame],
  );

  const markRead = useCallback(
    (conversationId: string, lastReadMessageId: string) => {
      const sent = sendFrame({
        type: "read",
        conversation_id: conversationId,
        message_id: lastReadMessageId,
      });
      if (!sent) {
        void chatApi.markReadRest(conversationId, lastReadMessageId);
      }
    },
    [sendFrame],
  );

  const initiateCall = useCallback(
    async (friendUsername: string) => {
      return chatApi.startDirectCall(friendUsername, true);
    },
    [],
  );

  return {
    connected,
    sendMessage,
    sendTyping,
    markRead,
    initiateCall,
  };
};
