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

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error("Failed to upload image");
            }

            const data = await response.json();

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