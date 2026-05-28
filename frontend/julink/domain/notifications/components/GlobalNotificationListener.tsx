"use client";

import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { useAppDispatch } from "@/store/hooks";
import { useUser } from "@/domain/profile/hooks/useUser";
import { newNotificationReceived, fetchUnreadCount } from "../store/notificationSlice";

export function GlobalNotificationListener() {
  const dispatch = useAppDispatch();
  const { myUsername, loadMyUsername } = useUser();
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    // Request permission for native browser notifications on mount
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(console.error);
      }
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    if (!myUsername) {
      loadMyUsername().catch(console.error);
      return; // Wait for username to be loaded
    }

    // Load initial unread count
    dispatch(fetchUnreadCount());

    const client = new Client({
      brokerURL: "ws://localhost:8080/ws",
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        // console.log(str);
      },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`Connected to STOMP server globally for notifications of: ${myUsername}`);

        client.subscribe(`/topic/notifications/${myUsername}`, (message) => {
          try {
            const payload = JSON.parse(message.body);
            dispatch(newNotificationReceived(payload));

            // Show native browser notification if permitted
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification("JULink Notification", {
                body: payload.message,
                icon: payload.actorProfilePicture || "/favicon.ico",
              });
            }
          } catch (e) {
            console.error("Error parsing notification message:", e);
          }
        });
      },
      onStompError: (frame) => {
        console.error("STOMP notifications error:", frame.headers["message"]);
      },
    });

    stompClientRef.current = client;
    client.activate();

    return () => {
      client.deactivate();
    };
  }, [myUsername, dispatch, loadMyUsername]);

  return null; // This is a background/headless listener component
}
