import { useState, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  userId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  aspectRatio?: "square" | "wide" | "portrait";
  className?: string;
  placeholder?: string;
}

export function ImageUpload({
  userId,
  value,
  onChange,
  aspectRatio = "square",
  className = "",
  placeholder = "Upload image",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const aspectClasses = {
    square: "aspect-square",
    wide: "aspect-video",
    portrait: "aspect-[3/4]",
  };

  const handleUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast({ title: "Please select an image file", variant: "destructive" });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Image must be less than 5MB", variant: "destructive" });
        return;
      }

      setUploading(true);
      try {
        const ext = file.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("portfolio-assets")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("portfolio-assets")
          .getPublicUrl(fileName);

        onChange(data.publicUrl);
        toast({ title: "Image uploaded successfully" });
      } catch (error) {
        console.error("Upload error:", error);
        toast({ title: "Upload failed", variant: "destructive" });
      } finally {
        setUploading(false);
      }
    },
    [userId, onChange, toast]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
  }, [onChange]);

  return (
    <div className={`relative ${className}`}>
      {value ? (
        <div className={`relative ${aspectClasses[aspectRatio]} rounded-lg overflow-hidden bg-secondary`}>
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          <Button
            size="sm"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8 p-0"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center ${aspectClasses[aspectRatio]} rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-secondary/20`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            </>
          )}
        </label>
      )}
    </div>
  );
}
