import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadResult {
  url: string | null;
  error: string | null;
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, path?: string, bucket: string = "package-images"): Promise<UploadResult> => {
    if (!file) {
      return { url: null, error: "No file provided" };
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return { url: null, error: "Please upload a valid image (JPEG, PNG, WebP, or GIF)" };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { url: null, error: "Image must be less than 5MB" };
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("package-images")
        .getPublicUrl(filePath);

      return { url: publicUrl, error: null };
    } catch (error: any) {
      console.error("Upload error:", error);
      return { url: null, error: error.message || "Failed to upload image" };
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (url: string, bucket: string = "package-images"): Promise<boolean> => {
    try {
      // Extract file path from URL
      const urlParts = url.split(`/${bucket}/`);
      if (urlParts.length < 2) return false;

      const filePath = urlParts[1];
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      return !error;
    } catch (error) {
      console.error("Delete error:", error);
      return false;
    }
  };

  return { uploadImage, deleteImage, uploading };
}
