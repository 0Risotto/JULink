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
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRegister } from "../hooks/useRegister";
import { Colleges } from "../types";

export function RegisterCard() {
  const router = useRouter();
  const {
    registerUser,
    verifyOtp,
    resendOtp,
    reset,
    clearError,
    loading,
    error,
    step,
    isOtpSent,
    isOtpExpired,
    email,
  } = useRegister();

  const [form, setForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    college: "",
    password: "",
    confirmPassword: "",
  });

  const [otpField, setOtpField] = useState({
    otp: "",
  });

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const collegeList = Object.entries(Colleges);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
    // Clear password error when user types
    if (e.target.id === "password" || e.target.id === "confirmPassword") {
      setPasswordError(null);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtpField({ ...otpField, [e.target.id]: e.target.value });
  };

  const validatePasswords = () => {
    if (form.password !== form.confirmPassword) {
      setPasswordError("Passwords do not match!");
      return false;
    }
    if (form.password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    const success = await registerUser({
      username: form.username,
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      college: form.college as any, // Type assertion if needed
      password: form.password,
    });

    if (!success) {
      // Error is handled by the hook and displayed automatically
      return;
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpField.otp) {
      return;
    }

    const success = await verifyOtp(otpField.otp);

    if (success) {
      // Reset form after successful registration
      setForm({
        username: "",
        email: "",
        firstName: "",
        lastName: "",
        college: "",
        password: "",
        confirmPassword: "",
      });
      setOtpField({ otp: "" });
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    const success = await resendOtp();
    if (success) {
      setResendCooldown(60); // 60 seconds cooldown
      // Start countdown
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleBackToLogin = () => {
    reset();
    router.push("/login");
  };

  // Show OTP verification screen
  if (isOtpSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            Enter the OTP sent to {email || form.email}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleOtpSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otpField.otp}
                  onChange={handleOtpChange}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              {isOtpExpired && (
                <p className="text-amber-600 text-sm">
                  OTP has expired. Please request a new one.
                </p>
              )}

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : "Resend OTP"}
                </button>
              </div>
            </div>

            <CardFooter className="flex-col gap-2 mt-6 px-0">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleBackToLogin}
              >
                Back to Login
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Show registration form
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
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="college">Faculty</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
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
                      onClick={() => setForm({ ...form, college: key })}
                    >
                      {name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
            </div>

            {/* Error messages */}
            {passwordError && (
              <p className="text-red-500 text-sm">{passwordError}</p>
            )}

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
