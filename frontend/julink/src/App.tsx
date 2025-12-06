//import LoginPage from './features/auth/pages/LoginPage'
//import RegisterPage from './features/auth/pages/RegisterPage'
import { SidebarProvider } from './components/ui/sidebar'
//import OwnProfile from './features/profile/OwnProfile'
import './index.css'
import { ThemeProvider } from "@/components/theme/theme-provider"
import AppRoutes from './routes/AppRoutes'
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>      
        <AppRoutes />
      </SidebarProvider>    
    </ThemeProvider>
  )
}

export default App
