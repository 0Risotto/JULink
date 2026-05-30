"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationAction,
} from "@/domain/notifications/store/notificationSlice";
import { NotificationResponse, NotificationType } from "@/domain/notifications/types";
import {
  Bell,
  UserPlus,
  Heart,
  MessageSquare,
  Package,
  Hand,
  Trash2,
  Check,
  Inbox,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { PostPreview } from "@/domain/notifications/components/PostPreview";

type TabType = "ALL" | "INTERACTIONS" | "FOLLOWS" | "LOST_AND_FOUND" | "MESSAGES";

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { notifications, loadingNotifications, hasMore, page, unreadCount } = useAppSelector(
    (state) => state.notifications
  );

  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    dispatch(fetchNotifications({ page: 0, reset: true }));
  }, [dispatch]);

  const handleLoadMore = async () => {
    if (hasMore && !loadingNotifications && !loadingMore) {
      setLoadingMore(true);
      await dispatch(fetchNotifications({ page: page + 1 }));
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!hasMore || loadingNotifications || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingNotifications, loadingMore, page, activeTab]);

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleNotificationClick = async (item: NotificationResponse) => {
    if (!item.read) {
      dispatch(markNotificationAsRead(item.id));
    }

    // Direct routing based on notification target
    if (item.targetType === "LOST_AND_FOUND") {
      router.push("/lost-and-found");
    } else if (item.targetType === "USER" && item.actorUsername) {
      router.push(`/${item.actorUsername}`);
    } else if (item.targetType === "POST" && item.actorUsername) {
      router.push(`/${item.actorUsername}`);
    } else if (item.targetType === "COMMENT" && item.actorUsername) {
      router.push(`/${item.actorUsername}`);
    } else if (item.targetType === "PROFILE" && item.actorUsername) {
      router.push(`/${item.actorUsername}`);
    } else if (item.targetType === "CONVERSATION") {
      router.push("/chat");
    }
  };

  const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Avoid triggering click route
    dispatch(deleteNotificationAction(id));
  };

  // Filter notifications locally based on tab
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "INTERACTIONS") {
      return (
        item.type === NotificationType.POST_LIKED ||
        item.type === NotificationType.POST_COMMENTED ||
        item.type === NotificationType.COMMENT_LIKED ||
        item.type === NotificationType.COMMENT_REPLIED
      );
    }
    if (activeTab === "FOLLOWS") {
      return item.type === NotificationType.FOLLOWED_YOU;
    }
    if (activeTab === "LOST_AND_FOUND") {
      return (
        item.type === NotificationType.LOST_AND_FOUND_POSTED ||
        item.type === NotificationType.LOST_AND_FOUND_CLAIM_REQUESTED
      );
    }
    if (activeTab === "MESSAGES") {
      return item.type === NotificationType.NEW_MESSAGE;
    }
    return true;
  });

  return (
    <div className="w-full max-w-[700px] mx-auto py-6 px-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <Check className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b mb-6">
        {[
          { id: "ALL", label: "All" },
          { id: "INTERACTIONS", label: "Interactions" },
          { id: "FOLLOWS", label: "Follows" },
          { id: "LOST_AND_FOUND", label: "Lost & Found" },
          { id: "MESSAGES", label: "Messages" }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.id as TabType)}
            className="flex-shrink-0"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Main content */}
      {loadingNotifications && notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner className="w-8 h-8 mb-2" />
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-lg bg-muted/20">
          <Inbox className="w-10 h-10 text-muted-foreground mb-3 stroke-[1.5]" />
          <p className="font-semibold text-base mb-1">No notifications found</p>
          <p className="text-sm text-muted-foreground text-center px-4 max-w-sm">
            {activeTab === "ALL" 
              ? "When you receive direct messages, comments, likes, or lost & found claim requests, they will appear here."
              : `You have no notifications in the "${activeTab.toLowerCase().replace(/_/g, " ")}" category.`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y border rounded-xl overflow-hidden bg-card shadow-sm">
          {filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`cursor-pointer transition-all flex items-start justify-between w-full py-4 px-3 hover:bg-muted/30 gap-4 ${
                !item.read ? "bg-muted/10" : ""
              }`}
              onClick={() => handleNotificationClick(item)}
            >
              {/* Left part: Indicator, Avatar, Text info */}
              <div className="flex-1 flex items-start gap-3.5 min-w-0">
                {/* Indicator dot */}
                {!item.read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0 animate-pulse" />
                )}

                {/* Actor Avatar with dynamic profile photo as rounded square */}
                {item.actorProfilePicture ? (
                  <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border shadow-sm">
                    <img
                      src={item.actorProfilePicture}
                      alt={item.actorUsername || "User"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border shadow-sm select-none">
                    {item.actorUsername ? item.actorUsername.charAt(0).toUpperCase() : "U"}
                  </div>
                )}

                {/* Text details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1 text-sm font-medium">

                    {item.actorUsername && (
                      <span className="font-bold text-foreground hover:underline">
                        {item.actorUsername}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap leading-relaxed">
                    {item.message}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              {/* Right part: PostPreview (at the topmost right) and Delete button */}
              <div className="flex items-start gap-2 shrink-0">
                {/* Post Preview screen for liked or commented posts */}
                {item.targetType === "POST" && item.targetId && (
                  <PostPreview postId={item.targetId} />
                )}

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 self-center"
                  onClick={(e) => handleDeleteNotification(e, item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div ref={observerRef} className="flex justify-center mt-6 pt-2 min-h-[50px] items-center">
              {(loadingNotifications || loadingMore) && <Spinner />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
