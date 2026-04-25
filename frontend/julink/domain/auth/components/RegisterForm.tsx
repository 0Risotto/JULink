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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegister } from "../hooks/useRegister";
import { Colleges } from "../types";
import { validateRegisterForm } from "../schemas/registerSchema";

export function RegisterForm() {
  const router = useRouter();
  const { registerUser, reset, loading, error } = useRegister();

  const [form, setForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    college: "",
    password: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const collegeList = Object.entries(Colleges);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
    if (formErrors[e.target.id]) {
      setFormErrors({ ...formErrors, [e.target.id]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateRegisterForm(form);
    
    if (!validation.success && validation.errors) {
      setFormErrors(validation.errors);
      return;
    }

    await registerUser({
      username: form.username,
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      college: form.college as any,
      password: form.password,
    });
  };

  const handleBackToLogin = () => {
    reset();
    router.push("/login");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create your JULink account</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={handleChange}
                placeholder="your_username"
                required
                disabled={loading}
              />
              {formErrors.username && <p className="text-red-500 text-sm">{formErrors.username}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="user@ju.edu.jo"
                required
                disabled={loading}
              />
              {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  required
                  disabled={loading}
                />
                {formErrors.firstName && <p className="text-red-500 text-sm">{formErrors.firstName}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  required
                  disabled={loading}
                />
                {formErrors.lastName && <p className="text-red-500 text-sm">{formErrors.lastName}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="college">Faculty</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    disabled={loading}
                  >
                    {form.college
                      ? Colleges[form.college as keyof typeof Colleges]
                      : "Select Faculty"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto">
                  <DropdownMenuLabel>Faculties</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {collegeList.map(([key, name]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => {
                        setForm({ ...form, college: key });
                        if (formErrors.college) setFormErrors({ ...formErrors, college: "" });
                      }}
                    >
                      {name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {formErrors.college && <p className="text-red-500 text-sm">{formErrors.college}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              {formErrors.password && <p className="text-red-500 text-sm">{formErrors.password}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Repeat Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-sm">{formErrors.confirmPassword}</p>
              )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          <CardFooter className="flex-col gap-2 mt-6 px-0">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Register"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleBackToLogin}
              disabled={loading}
            >
              Back to Login
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
