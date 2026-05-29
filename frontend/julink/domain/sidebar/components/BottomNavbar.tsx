"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, MessageSquare, Search, Box, Bell, Settings } from "lucide-react"
import { useAppSelector } from "@/store/hooks"
import { useUser } from "@/domain/profile/hooks/useUser"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const items = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Search", url: "/search", icon: Search },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Lost & Found", url: "/lost-and-found", icon: Box },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function BottomNavbar() {
  const pathname = usePathname()
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount)
  const activeConversationId = useAppSelector((state) => state.chat.activeConversationId)
  const { currentUser, loadMyProfile } = useUser()

  useEffect(() => {
    if (!currentUser) {
      loadMyProfile().catch((err) => {
        console.error("Failed to load profile for bottom navbar user", err)
      })
    }
  }, [currentUser, loadMyProfile])

  const profileUrl = currentUser ? `/${currentUser.username}` : "#"
  const isProfileActive = currentUser && pathname === `/${currentUser.username}`

  if (pathname.startsWith("/chat") && activeConversationId !== null) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background flex items-center justify-around px-1 md:hidden pb-safe">
      {items.map((item) => {
        const isActive = pathname === item.url || (pathname === "/" && item.url === "/home");
        const Icon = item.icon;

        return (
          <Link
            key={item.title}
            href={item.url}
            className={cn(
              "relative flex flex-col items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors w-full h-full",
              isActive && "text-foreground dark:text-white"
            )}
          >
            <Icon
              className={cn(
                "h-5.5 w-5.5 transition-all",
                isActive 
                  ? "fill-foreground text-foreground dark:fill-white dark:text-white scale-110" 
                  : "text-muted-foreground"
              )}
            />
            {item.title === "Notifications" && unreadCount > 0 && (
              <span className="absolute top-2 right-1/2 translate-x-3.5 bg-primary text-primary-foreground text-[9px] font-bold px-1 py-0.5 rounded-full min-w-4.5 h-4.5 flex items-center justify-center shadow-sm">
                {unreadCount}
              </span>
            )}
          </Link>
        );
      })}

      {/* Profile Avatar Item */}
      <Link
        href={profileUrl}
        className={cn(
          "relative flex flex-col items-center justify-center p-2 transition-colors w-full h-full",
          isProfileActive ? "scale-110" : ""
        )}
      >
        <Avatar
          className={cn(
            "h-6.5 w-6.5 transition-all border",
            isProfileActive
              ? "border-foreground dark:border-white ring-2 ring-primary ring-offset-2 dark:ring-offset-background"
              : "border-muted"
          )}
        >
          <AvatarImage src={currentUser?.profilePicture || undefined} alt={currentUser?.username} />
          <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">
            {currentUser?.firstName?.[0]}
            {currentUser?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
      </Link>
    </nav>
  )
}
