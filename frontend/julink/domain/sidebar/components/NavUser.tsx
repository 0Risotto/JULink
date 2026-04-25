"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Settings
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useUser } from "@/domain/profile/hooks/useUser"
import { useEffect } from "react"
import { useAppDispatch } from "@/store/hooks"
import { logout } from "@/domain/auth/store/loginSlice"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { currentUser, loadMyProfile } = useUser()
  const dispatch = useAppDispatch()
  const router = useRouter()

  useEffect(() => {
    if (!currentUser) {
      loadMyProfile().catch((err) => {
        console.error("Failed to load profile for nav user", err);
      })
    }
  }, [currentUser, loadMyProfile])

  const handleLogout = () => {
    dispatch(logout())
    router.push("/login")
  }

  if (!currentUser) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="flex justify-center">
            <Spinner className="h-4 w-4" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={currentUser.profilePicture || undefined} alt={currentUser.username} />
                <AvatarFallback className="rounded-lg">{currentUser.firstName?.[0]}{currentUser.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{currentUser.firstName} {currentUser.lastName}</span>
                <span className="truncate text-xs">@{currentUser.username}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={currentUser.profilePicture || undefined} alt={currentUser.username} />
                  <AvatarFallback className="rounded-lg">{currentUser.firstName?.[0]}{currentUser.lastName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{currentUser.firstName} {currentUser.lastName}</span>
                  <span className="truncate text-xs">@{currentUser.username}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push(`/${currentUser.username}`)}>
                <BadgeCheck className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/settings`)}>
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}