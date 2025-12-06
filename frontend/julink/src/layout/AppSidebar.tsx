import { Link, useLocation } from "react-router-dom"
import { Home, Search, User, PlusSquare, Heart } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Search", url: "/search", icon: Search },
  { title: "Activity", url: "/activity", icon: Heart },
  { title: "Create", url: "/create", icon: PlusSquare },
  { title: "Profile", url: "/profile/anas04", icon: User },
]
import julinkLogo from '../assets/icons/julink_logo.svg'


export function AppSidebar() {
  const { pathname } = useLocation()

  return (
    
    <Sidebar className="border-r">
      <SidebarContent>
          {/* Logo at the top */}
      <div className="flex items-center py-4 pl-4 border-b">    
        <img src={julinkLogo} alt="Julink Logo" className="w-32 h-auto" />
      </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>

              {items.map((item) => {
                const Icon = item.icon
                const active =
                  item.url === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.url)

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                    >
                   <Link
                    to={item.url}
                    className="flex items-center px-3 py-8 text-xlg"
                   >
                    <Icon className="mr-4 " size= {100}/>
                    <span className="text-xl" >{item.title}</span>
                  </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
      </SidebarContent>
    </Sidebar>
  )
}
