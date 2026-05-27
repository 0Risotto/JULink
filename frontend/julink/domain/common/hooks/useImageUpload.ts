"use client";

import { useState, useCallback } from "react";

export const useImageUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const uploadImage = useCallback(async (file: File): Promise<string | null> => {
        setIsUploading(true);
        setUploadError(null);


        const CLOUD_NAME = "deymoklbe";
        const UPLOAD_PRESET = "julink_uploads";

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        console.log(`[Cloudinary Upload] Starting upload for file: ${file.name} (type: ${file.type}, size: ${file.size} bytes)`);

        try {
            // Use 'auto' instead of 'image' to support both images and videos seamlessly
            const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
            console.log(`[Cloudinary Upload] Request URL: ${url}`);

            const response = await fetch(url, {
                method: "POST",
                body: formData,
            });

            console.log(`[Cloudinary Upload] Raw response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Cloudinary Upload] Error response body:`, errorText);
                throw new Error(`Failed to upload media. Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("[Cloudinary Upload] Success! Full parsed response:", data);

            return data.secure_url;

        } catch (error: any) {
            console.error("Upload error:", error);
            setUploadError(error.message || "An error occurred during upload");
            return null;
        } finally {
            setIsUploading(false);
        }
    }, []);

    return { uploadImage, isUploading, uploadError };
};