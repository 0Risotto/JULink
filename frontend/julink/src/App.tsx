//import LoginPage from './features/auth/pages/LoginPage'
//import RegisterPage from './features/auth/pages/RegisterPage'
import OwnProfile from './features/profile/OwnProfile'
import './index.css'
import { ThemeProvider } from "@/components/theme/theme-provider"
function App() {
  return (
     <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <OwnProfile/>
      
   </ThemeProvider>
  )
}

export default App
