"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ImageMessageProps {
  url: string;
  filename: string;
}

export function ImageMessage({ url, filename }: ImageMessageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative group overflow-hidden rounded-md max-w-[250px] sm:max-w-[300px]">
        <img
          src={url}
          alt={filename}
          className="w-full h-auto object-cover max-h-[300px] cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setOpen(true)}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden border-none bg-transparent flex items-center justify-center shadow-none">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <img 
            src={url} 
            alt={filename} 
            className="w-full h-full object-contain max-h-[90vh] rounded-md" 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
