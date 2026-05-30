"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "../hooks/useLogin";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateLoginForm } from "../schemas/loginSchema";
import { Eye, EyeOff } from "lucide-react";

export function LoginCard() {
  const { login, loading, error } = useLogin();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
    if (formErrors[e.target.id]) {
      setFormErrors({ ...formErrors, [e.target.id]: "" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedForm = {
      email: form.email.trim(),
      password: form.password,
    };
    const validation = validateLoginForm(trimmedForm);
    
    if (!validation.success && validation.errors) {
      setFormErrors(validation.errors);
      return;
    }
    
    login(trimmedForm.email, trimmedForm.password);
  };
  const handleBackToRegister = () => {
    router.push("/register");
  };


  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>Welcome to JULink</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Username or Email</Label>
              <Input
                id="email"
                type="text"
                onChange={handleChange}
                value={form.email}
                required
              />
              {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  onChange={handleChange}
                  value={form.password}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formErrors.password && <p className="text-red-500 text-sm">{formErrors.password}</p>}
            </div>

            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-col mt-4 gap-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>

          <Button variant="outline" className="w-full" onClick={handleBackToRegister}>
            Register
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
