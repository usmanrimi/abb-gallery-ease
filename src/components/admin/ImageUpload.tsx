import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link as LinkIcon, X, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  defaultValue?: string;
  bucket?: string;
  label?: string;
  className?: string;
}

export function ImageUpload({
  onUpload,
  defaultValue = "",
  bucket = "uploads",
  label = "Image",
  className = "",
}: ImageUploadProps) {
  const [useUrl, setUseUrl] = useState(false);
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setUrl(publicUrl);
      onUpload(publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    onUpload(newUrl);
  };

  const clearImage = () => {
    setUrl("");
    onUpload("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] uppercase tracking-wider"
          onClick={() => setUseUrl(!useUrl)}
        >
          {useUrl ? <Upload className="h-3 w-3 mr-1" /> : <LinkIcon className="h-3 w-3 mr-1" />}
          {useUrl ? "Use Upload" : "Use URL"}
        </Button>
      </div>

      <div className="relative group">
        {url ? (
          <div className="relative aspect-video rounded-lg border bg-muted/50 overflow-hidden">
            <img
              src={url}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-background rounded-full shadow-sm transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => !useUrl && fileInputRef.current?.click()}
            className={`aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-muted/30 transition-colors ${!useUrl ? "cursor-pointer hover:bg-muted/50 hover:border-primary/50" : ""}`}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  {useUrl ? "Enter image URL" : "Click to upload image"}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {useUrl ? (
        <Input
          placeholder="https://example.com/image.jpg"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="h-9"
        />
      ) : (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
      )}
    </div>
  );
}
