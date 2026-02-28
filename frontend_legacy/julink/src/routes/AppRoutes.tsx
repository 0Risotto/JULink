import { BrowserRouter, Routes, Route } from "react-router-dom"
import LoginPage from "@/features/auth/pages/LoginPage"
import RegisterPage from "@/features/auth/pages/RegisterPage"
import Layout from "@/layout/Layout"
import { HomePage } from "@/features/home/HomePage"
import CreatePage from "@/features/create/CreatePage"
import { SearchPage } from "@/features/search/SearchPage"
import OwnProfile from "@/features/profile/OwnProfile"

// Pages


export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        

        
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/profile/:username" element={<OwnProfile />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}
