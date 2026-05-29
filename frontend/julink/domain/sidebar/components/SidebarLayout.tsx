"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { AppSidebar } from "./AppSidebar"
import { BottomNavbar } from "./BottomNavbar"
import { AuthGuard } from "@/domain/auth/components/AuthGuard"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { setSidebarOpen } from "../store/sidebarSlice"
import { GlobalCallListener } from "@/domain/call/components/GlobalCallListener"
import { GlobalNotificationListener } from "@/domain/notifications/components/GlobalNotificationListener"
import { useTheme } from "next-themes"
import { useUser } from "@/domain/profile/hooks/useUser"
import { useEffect } from "react"

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { theme, setTheme } = useTheme()
  const { currentUser } = useUser()
  
  // Sync theme with backend user preference
  useEffect(() => {
    if (currentUser?.themePreference) {
      const backendTheme = currentUser.themePreference.toLowerCase();
      if (theme !== backendTheme) {
        setTheme(backendTheme);
      }
    }
  }, [currentUser?.themePreference, theme, setTheme])
  
  // Get sidebar state from Redux
  const isOpen = useAppSelector((state) => state.sidebar.isOpen)

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register")

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <AuthGuard>
      <SidebarProvider 
        open={isOpen} 
        onOpenChange={(open) => dispatch(setSidebarOpen(open))}
      >
        <GlobalCallListener />
        <GlobalNotificationListener />
        <AppSidebar />
        <SidebarInset className={pathname.startsWith("/chat") ? "h-[100dvh] overflow-hidden flex flex-col" : ""}>
          <header className="hidden md:flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="w-full">
              {/* Optional: Add Breadcrumbs or Search bar here in the future */}
            </div>
          </header>
          <main className={cn(
            "flex-1 bg-background min-h-0",
            pathname.startsWith("/chat") 
              ? "overflow-hidden flex flex-col" 
              : "overflow-auto pb-16 md:pb-0"
          )}>
            {children}
          </main>
          <BottomNavbar />
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}