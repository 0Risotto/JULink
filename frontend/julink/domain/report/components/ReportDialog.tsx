"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Flag, CheckCircle2, AlertCircle } from "lucide-react";
import * as reportServices from "../services/reportServices";
import { ReportTargetType } from "../types";

interface ReportDialogProps {
  targetType: ReportTargetType;
  targetId: string;
  trigger: React.ReactNode;
}

const REPORT_REASONS = [
  { value: "SPAM", label: "Spam or misleading" },
  { value: "HARASSMENT", label: "Harassment or bullying" },
  { value: "HATE_SPEECH", label: "Hate speech or discrimination" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate content or nudity" },
  { value: "VIOLENCE", label: "Violence or harmful behavior" },
  { value: "OTHER", label: "Other" },
];

export default function ReportDialog({ targetType, targetId, trigger }: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state on close
      setReason("");
      setDescription("");
      setError(null);
      setSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError("Please select a reason for reporting.");
      return;
    }

    const trimmedDesc = description.trim();
    if (reason === "OTHER" && !trimmedDesc) {
      setError("Please describe the issue in the description box.");
      return;
    }

    setLoading(true);
    setError(null);

    // Format the report message sent to the backend
    const selectedReasonLabel = REPORT_REASONS.find((r) => r.value === reason)?.label || reason;
    const reportMessage = trimmedDesc 
      ? `[${selectedReasonLabel}] ${trimmedDesc}`
      : selectedReasonLabel;

    try {
      let response;
      if (targetType === "POST") {
        // Post can be reported via either endpoint, let's use the generic one as it is more consistent 
        // and records the reporter's context perfectly.
        response = await reportServices.createReport({
          targetType,
          targetId,
          message: reportMessage,
        });
      } else {
        response = await reportServices.createReport({
          targetType,
          targetId,
          message: reportMessage,
        });
      }

      if (response.status === "success") {
        setSuccess(true);
      } else {
        setError("Failed to file report. Please try again.");
      }
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } }; message?: string };
      const serverMsg = errorResponse.response?.data?.message || errorResponse.message;
      setError(serverMsg || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTargetLabel = () => {
    switch (targetType) {
      case "USER":
        return "user";
      case "POST":
        return "post";
      case "MESSAGE":
        return "message";
      default:
        return "item";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-w-md w-[95vw] rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Flag className="w-5 h-5 text-red-500" />
            Report {getTargetLabel()}
          </DialogTitle>
          <DialogDescription>
            Help us keep JULink safe and clean. Please tell us {"what's"} wrong.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in duration-300">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
            <h3 className="font-semibold text-lg">Thank You</h3>
            <p className="text-sm text-muted-foreground mt-1 px-4">
              Your report has been submitted. We take user feedback seriously and will review this {getTargetLabel()} shortly.
            </p>
            <Button className="mt-6 w-32" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900/30">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Reason for Report
              </label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Additional Details {reason !== "OTHER" && <span className="text-muted-foreground font-normal">(Optional)</span>}
              </label>
              <Textarea
                placeholder={
                  reason === "OTHER"
                    ? "Please describe the behavior or issue in detail..."
                    : "Add any additional context or details..."
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                className="min-h-24 resize-none text-sm"
              />
              <div className="flex justify-end text-[10px] text-muted-foreground">
                {description.length}/1000 characters
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={loading} className="w-28">
                {loading ? <Spinner className="w-4 h-4 text-white" /> : "Submit Report"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
