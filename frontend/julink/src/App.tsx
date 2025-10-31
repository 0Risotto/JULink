import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import './index.css'
import { ThemeProvider } from "@/components/theme/theme-provider"
function App() {
  return (
     <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <RegisterPage/>
   </ThemeProvider>
  )
}

export default App
