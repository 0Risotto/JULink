"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  sendForgotPasswordOtpService,
  resetPasswordWithOtpService,
} from "../services/authServices";

interface ForgotPasswordDialogProps {
  trigger: React.ReactNode;
}

export function ForgotPasswordDialog({ trigger }: ForgotPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!email.toLowerCase().endsWith("@ju.edu.jo")) {
      setError("Email must end with @ju.edu.jo");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await sendForgotPasswordOtpService(email);
      if (res.status === "success") {
        setStep("reset");
        setError(null);
      } else {
        setError(res.message || "Failed to send reset OTP. Check your email address.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await resetPasswordWithOtpService({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });

      if (res.status === "success") {
        setSuccess("Password reset successfully! You can now log in with your new password.");
        setError(null);
        setTimeout(() => {
          setOpen(false);
          // Reset states
          setStep("email");
          setEmail("");
          setOtp("");
          setNewPassword("");
          setConfirmPassword("");
          setSuccess(null);
        }, 3000);
      } else {
        setError(res.message || "Failed to reset password. Please verify your OTP.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state on close
      setStep("email");
      setEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      setSuccess(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md w-[95vw] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Reset Password</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-green-600 font-semibold">{success}</p>
          </div>
        ) : step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Enter your JU student or staff email address, and we'll send you an OTP to reset your password.
            </p>

            <div className="space-y-2">
              <Label htmlFor="forgot-email">JU Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="username@ju.edu.jo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending OTP..." : "Send Reset OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              An OTP has been sent to <span className="font-semibold text-foreground">{email}</span>. Please enter the OTP and your new password.
            </p>

            <div className="space-y-2">
              <Label htmlFor="forgot-otp">OTP Code</Label>
              <div className="flex justify-center py-1">
                <InputOTP
                  id="forgot-otp"
                  maxLength={6}
                  value={otp}
                  onChange={(val) => setOtp(val)}
                  required
                  disabled={loading}
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

            <div className="space-y-2">
              <Label htmlFor="forgot-new-password">New Password</Label>
              <Input
                id="forgot-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="forgot-confirm-password">Confirm Password</Label>
              <Input
                id="forgot-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Repeat your password"
              />
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep("email")}
                disabled={loading}
              >
                Back
              </Button>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
