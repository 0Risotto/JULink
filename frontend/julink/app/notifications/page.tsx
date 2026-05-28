"use client";

import React, { useEffect, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { notifications, loadingNotifications, hasMore, page, unreadCount } = useAppSelector(
    (state) => state.notifications
  );

  const [loadingMore, setLoadingMore] = useState(false);

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

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.FOLLOWED_YOU:
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case NotificationType.POST_LIKED:
      case NotificationType.COMMENT_LIKED:
        return <Heart className="w-4 h-4 text-red-500" />;
      case NotificationType.POST_COMMENTED:
      case NotificationType.COMMENT_REPLIED:
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case NotificationType.LOST_AND_FOUND_POSTED:
        return <Package className="w-4 h-4 text-amber-500" />;
      case NotificationType.LOST_AND_FOUND_CLAIM_REQUESTED:
        return <Hand className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="w-full max-w-[700px] mx-auto py-6 px-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
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

      {/* Main content */}
      {loadingNotifications && notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner className="w-8 h-8 mb-2" />
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-lg bg-muted/20">
          <Inbox className="w-10 h-10 text-muted-foreground mb-3 stroke-[1.5]" />
          <p className="font-semibold text-base mb-1">No notifications yet</p>
          <p className="text-sm text-muted-foreground text-center px-4 max-w-sm">
            When you receive direct messages, comments, likes, or lost & found claim requests, they will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((item) => (
            <Card
              key={item.id}
              className={`cursor-pointer transition-colors border overflow-hidden hover:bg-muted/30 ${
                !item.read ? "bg-muted/10 border-primary/20" : ""
              }`}
              onClick={() => handleNotificationClick(item)}
            >
              <CardContent className="p-4 flex items-start gap-4">
                {/* Indicator dot */}
                {!item.read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                )}

                {/* Actor Avatar */}
                <Avatar className="w-10 h-10 shrink-0 border">
                  <AvatarImage src={item.actorProfilePicture || undefined} />
                  <AvatarFallback className="text-sm font-semibold bg-primary/5">
                    {item.actorUsername ? item.actorUsername.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>

                {/* Text and Actions */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1 text-sm font-medium">
                    <span className="bg-muted p-1 rounded-md flex items-center justify-center shrink-0">
                      {getNotificationIcon(item.type)}
                    </span>
                    {item.actorUsername && (
                      <span className="font-semibold text-foreground hover:underline">
                        {item.actorUsername}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
                    {item.message}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 self-center"
                  onClick={(e) => handleDeleteNotification(e, item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingNotifications || loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load older notifications"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
