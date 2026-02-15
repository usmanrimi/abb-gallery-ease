import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Video, X, Loader2, CheckCircle } from "lucide-react";

interface PaymentProofUploadProps {
  orderId: string;
  onUploadComplete?: () => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4"];

export function PaymentProofUpload({ orderId, onUploadComplete }: PaymentProofUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG image or MP4 video",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Maximum size is ${isImage ? "5MB for images" : "20MB for videos"}`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${orderId}-${Date.now()}.${fileExt}`;
      const isVideo = ACCEPTED_VIDEO_TYPES.includes(selectedFile.type);

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);

      // Update order with proof URL
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_proof_url: urlData.publicUrl,
          payment_proof_type: isVideo ? "video" : "image",
          payment_status: "proof_uploaded",
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Create notification for admin
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin_ops", "super_admin"]);

      if (adminRoles && adminRoles.length > 0) {
        await supabase.from("notifications").insert(
          adminRoles.map((admin) => ({
            user_id: admin.user_id,
            order_id: orderId,
            title: "Payment Proof Uploaded",
            message: `Customer has uploaded payment proof for order. Please verify.`,
          }))
        );
      }

      setUploaded(true);
      toast({
        title: "Proof uploaded successfully",
        description: "Admin will review and confirm your payment",
      });

      onUploadComplete?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (uploaded) {
    return (
      <Card className="border-success/50 bg-success/5">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
          <h3 className="font-semibold text-success">Proof Uploaded</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Admin will review and confirm your payment shortly
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Payment Proof
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.mp4"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <div className="flex justify-center gap-4 mb-3">
              <Image className="h-8 w-8 text-muted-foreground" />
              <Video className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium">Click to select file</p>
            <p className="text-sm text-muted-foreground mt-1">
              JPG, PNG (max 5MB) or MP4 (max 20MB)
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-muted">
              {ACCEPTED_VIDEO_TYPES.includes(selectedFile.type) ? (
                <video
                  src={preview || undefined}
                  controls
                  className="w-full max-h-48 object-contain"
                />
              ) : (
                <img
                  src={preview || undefined}
                  alt="Payment proof preview"
                  className="w-full max-h-48 object-contain"
                />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={clearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
            </p>
            <Button
              className="w-full"
              onClick={handleUpload}
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
                  Upload Proof
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
