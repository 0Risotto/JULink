import { Outlet } from "react-router-dom"
import { AppSidebar } from "./AppSidebar"

export default function Layout() {
  return (
    <div className="flex h-screen w-full">
      <AppSidebar />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto ">
        <Outlet />
      </div>
    </div>
  )
}
