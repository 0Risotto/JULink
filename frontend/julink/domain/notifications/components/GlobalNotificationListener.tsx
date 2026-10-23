"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { useUser } from "@/domain/profile/hooks/useUser";
import {
  fetchUnreadCount,
  newNotificationReceived,
} from "../store/notificationSlice";
import { getWsBaseUrl, getWsTicket } from "@/util/api/axios";
import { BackendNotification, mapNotification } from "../services/notificationService";

export function GlobalNotificationListener() {
  const dispatch = useAppDispatch();
  const { myUsername, loadMyUsername } = useUser();

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(console.error);
      }
    }
  }, []);

  useEffect(() => {
    if (!myUsername) {
      loadMyUsername().catch(console.error);
      return;
    }

    dispatch(fetchUnreadCount());

    let closed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      try {
        const { ticket } = await getWsTicket();
        if (closed) return;

        socket = new WebSocket(
          `${getWsBaseUrl()}/ws?ticket=${encodeURIComponent(ticket)}`,
        );

        socket.onmessage = (event) => {
          try {
            const frame = JSON.parse(event.data as string) as {
              type?: string;
              notification?: BackendNotification;
            };

            if (frame.type === "notification.created" && frame.notification) {
              const notification = mapNotification(frame.notification);
              dispatch(newNotificationReceived(notification));

              if (
                typeof window !== "undefined" &&
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification("JULink Notification", {
                  body: notification.message,
                  icon: notification.actorProfilePicture || "/favicon.ico",
                });
              }
            }
          } catch (error) {
            console.error("Error parsing notification frame", error);
          }
        };

        socket.onclose = () => {
          if (!closed) reconnectTimer = setTimeout(connect, 3000);
        };
        socket.onerror = () => socket?.close();
      } catch (error) {
        console.error("Could not open notification socket", error);
        if (!closed) reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [myUsername, dispatch, loadMyUsername]);

  return null;
}
