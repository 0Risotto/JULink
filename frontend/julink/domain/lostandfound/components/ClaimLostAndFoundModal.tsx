import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { claimLostAndFound } from "../service/lostAndFoundService";
import { Spinner } from "@/components/ui/spinner";
import { Handshake } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  onSuccess: () => void;
}

export default function ClaimLostAndFoundModal({ open, onOpenChange, itemId, onSuccess }: Props) {
  const [message, setMessage] = useState("I think this item is mine. Can we talk?");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await claimLostAndFound(itemId, message.trim());
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleReset();
      }, 2000);
    } catch (err: any) {
      console.error("Failed to submit claim:", err);
      setError(err.response?.data?.message || "Something went wrong while submitting the claim.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessage("I think this item is mine. Can we talk?");
    setSuccess(false);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) handleReset();
      else onOpenChange(val);
    }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-primary" />
            Claim Item
          </DialogTitle>
          <DialogDescription>
            Send a claim request to the owner. This will notify them in real-time and provide them with your custom message.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 mb-4 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-lg text-foreground mb-1">Claim Submitted Successfully!</p>
            <p className="text-sm text-muted-foreground">The owner has been notified.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md font-medium border border-destructive/20">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="claim-message" className="text-sm font-semibold">
                Message to owner *
              </Label>
              <Textarea
                id="claim-message"
                placeholder="Write a friendly message explaining why you think this item is yours..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="min-h-[100px]"
                disabled={loading}
              />
            </div>

            <div className="flex justify-end gap-3 mt-4 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !message.trim()}>
                {loading ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Send Request"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
