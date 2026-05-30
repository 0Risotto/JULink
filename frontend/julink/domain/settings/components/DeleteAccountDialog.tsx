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
  sendDeleteOtpService,
  deleteAccountWithOtpService,
} from "@/domain/auth/services/authServices";

interface DeleteAccountDialogProps {
  trigger: React.ReactNode;
}

export function DeleteAccountDialog({ trigger }: DeleteAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm-text" | "otp">("confirm-text");
  const [confirmText, setConfirmText] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== "DELETE") {
      setError("Please type 'DELETE' to confirm.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await sendDeleteOtpService();
      if (res.status === "success") {
        setStep("otp");
        setError(null);
      } else {
        setError(res.message || "Failed to send deletion OTP. Please try again.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await deleteAccountWithOtpService({ otp: otp.trim() });

      if (res.status === "success") {
        setSuccess("Your account has been successfully deleted. Thank you for using JULink.");
        setError(null);
        setTimeout(() => {
          setOpen(false);
          localStorage.removeItem("token");
          window.location.href = "/login";
        }, 3000);
      } else {
        setError(res.message || "Failed to delete account. Please verify your OTP.");
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
      setStep("confirm-text");
      setConfirmText("");
      setOtp("");
      setError(null);
      setSuccess(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md w-[95vw] rounded-xl border-red-200 dark:border-red-950/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600">Delete Account</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-green-600 font-semibold">{success}</p>
          </div>
        ) : step === "confirm-text" ? (
          <form onSubmit={handleSendOtp} className="space-y-4 pt-2">
            <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-4 rounded-lg text-sm space-y-2">
              <p className="font-semibold">⚠️ Irreversible Action!</p>
              <p>
                Are you sure you want to permanently delete your JULink account? This will erase all your posts, messages, and profile information. This action cannot be undone.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirm" className="text-sm font-medium">
                To confirm deletion, please type <span className="font-bold text-red-600">DELETE</span>:
              </Label>
              <Input
                id="delete-confirm"
                type="text"
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <Button type="submit" variant="destructive" className="w-full" disabled={loading || confirmText !== "DELETE"}>
              {loading ? "Requesting OTP..." : "Confirm & Send Deletion OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleDeleteAccount} className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              A verification code (OTP) has been sent to your registered email to confirm account deletion. Please enter it below to finalize:
            </p>

            <div className="space-y-2">
              <Label htmlFor="delete-otp">OTP Code</Label>
              <div className="flex justify-center py-1">
                <InputOTP
                  id="delete-otp"
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

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:flex-1"
                onClick={() => setStep("confirm-text")}
                disabled={loading}
              >
                Back
              </Button>
              <Button type="submit" variant="destructive" className="w-full sm:flex-1" disabled={loading}>
                {loading ? "Deleting..." : "Permanently Delete Account"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
