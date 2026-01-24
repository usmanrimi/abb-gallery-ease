import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

export function ImageUpload({ label, value, onChange, placeholder }: ImageUploadProps) {
  const { uploadImage, uploading } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewError, setPreviewError] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadImage(file, "packages");
    if (result.error) {
      toast.error(result.error);
    } else if (result.url) {
      onChange(result.url);
      setPreviewError(false);
      toast.success("Image uploaded successfully!");
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange("");
    setPreviewError(false);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Preview */}
      {value && !previewError ? (
        <div className="relative w-full h-32 rounded-lg border overflow-hidden bg-muted/50">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-contain p-2"
            onError={() => setPreviewError(true)}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div 
          className="w-full h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{placeholder || "Click to upload image"}</span>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      {/* Upload button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            {value ? "Replace Image" : "Upload Image"}
          </>
        )}
      </Button>
    </div>
  );
}
