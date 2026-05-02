"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { AuthGuard } from "@/domain/auth/components/AuthGuard"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { setSidebarOpen } from "../store/sidebarSlice"
import { GlobalCallListener } from "@/domain/temp/call/components/GlobalCallListener"

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  
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
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="w-full">
              {/* Optional: Add Breadcrumbs or Search bar here in the future */}
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}