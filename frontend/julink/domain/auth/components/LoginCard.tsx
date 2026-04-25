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

export function LoginCard() {
  const { login, loading, error } = useLogin();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
    if (formErrors[e.target.id]) {
      setFormErrors({ ...formErrors, [e.target.id]: "" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateLoginForm(form);
    
    if (!validation.success && validation.errors) {
      setFormErrors(validation.errors);
      return;
    }
    
    login(form.email, form.password);
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@ju.edu.jo"
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
              <Input
                id="password"
                type="password"
                onChange={handleChange}
                value={form.password}
                required
              />
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
