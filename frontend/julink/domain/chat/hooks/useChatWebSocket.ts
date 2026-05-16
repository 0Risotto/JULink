import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { wsMessageReceived, wsTypingReceived, wsReadReceived } from "../store/chatSlice";
import { MessageType } from "../types";

export const useChatWebSocket = (myUsername: string | null) => {
  const dispatch = useAppDispatch();
  const conversations = useAppSelector((state) => state.chat.conversations);
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!myUsername) return;

    const token = localStorage.getItem("token");
    const socket = new SockJS(`http://localhost:8080/ws?token=${token}`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => {
        // console.log(str);
      },
      onConnect: () => {
        setConnected(true);
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      setConnected(false);
    };
  }, [myUsername]);

  useEffect(() => {
    const client = clientRef.current;
    if (!connected || !client || !myUsername) return;

    // Subscribe to each conversation topic
    const subscriptions = conversations.map((conv) => {
      const subMessages = client.subscribe(`/topic/conversations/${conv.id}`, (msg) => {
        const payload = JSON.parse(msg.body);
        dispatch(wsMessageReceived(payload));
      });

      const subTyping = client.subscribe(`/topic/conversations/${conv.id}/typing`, (msg) => {
        const payload = JSON.parse(msg.body);
        dispatch(wsTypingReceived(payload));
      });

      const subRead = client.subscribe(`/topic/conversations/${conv.id}/read`, (msg) => {
        const payload = JSON.parse(msg.body);
        if (payload.username !== myUsername) {
          dispatch(wsReadReceived(payload));
        }
      });

      return [subMessages, subTyping, subRead];
    });

    return () => {
      subscriptions.forEach((subs) => {
        subs.forEach((sub) => sub.unsubscribe());
      });
    };
  }, [connected, conversations, dispatch, myUsername]);

  // Methods to emit frames
  const sendMessage = (conversationId: number, content: string, messageType: MessageType = "TEXT") => {
    if (clientRef.current && clientRef.current.connected && myUsername) {
      clientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({
          conversationId,
          content,
          messageType,
          senderUsername: myUsername,
        }),
      });
    }
  };

  const sendTyping = (conversationId: number, isTyping: boolean) => {
    if (clientRef.current && clientRef.current.connected && myUsername) {
      clientRef.current.publish({
        destination: "/app/chat.typing",
        body: JSON.stringify({
          conversationId,
          username: myUsername,
          typing: isTyping,
        }),
      });
    }
  };

  const markRead = (conversationId: number, lastReadMessageId: number) => {
    if (clientRef.current && clientRef.current.connected && myUsername) {
      clientRef.current.publish({
        destination: "/app/chat.read",
        body: JSON.stringify({
          conversationId,
          lastReadMessageId,
          username: myUsername,
        }),
      });
    }
  };

  return {
    connected,
    sendMessage,
    sendTyping,
    markRead,
  };
};
