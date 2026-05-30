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
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegister } from "../hooks/useRegister";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export function OtpVerificationForm() {
  const router = useRouter();
  const {
    verifyOtp,
    resendOtp,
    reset,
    loading,
    error,
    isOtpExpired,
    email,
  } = useRegister();

  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return;
    const success = await verifyOtp(otp);
    if (success) {
      setOtp("");
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    const success = await resendOtp();
    if (success) {
      setResendCooldown(60);
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          Enter the OTP sent to {email}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleOtpSubmit}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="otp">OTP Code</Label>
              <div className="flex justify-center py-2">
                <InputOTP
                  id="otp"
                  maxLength={6}
                  value={otp}
                  onChange={(val) => setOtp(val)}
                  required
                  autoFocus
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSeparator />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
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
