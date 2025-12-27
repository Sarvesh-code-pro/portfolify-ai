import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Upload, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfilePictureUploadProps {
  userId: string;
  value: string | null;
  onChange: (url: string | null) => void;
}

interface CroppedArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ProfilePictureUpload({
  userId,
  value,
  onChange,
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);
  const { toast } = useToast();

  const onCropComplete = useCallback((_: CroppedArea, croppedAreaPixels: CroppedArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
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

      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    },
    [toast]
  );

  const createCroppedImage = async (): Promise<Blob | null> => {
    if (!imageSrc || !croppedAreaPixels) return null;

    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = 400;
    canvas.height = 400;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      400,
      400
    );

    return new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    });
  };

  const handleCropConfirm = async () => {
    setUploading(true);
    try {
      const croppedBlob = await createCroppedImage();
      if (!croppedBlob) throw new Error("Failed to crop image");

      const fileName = `${userId}/profile-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("portfolio-assets")
        .upload(fileName, croppedBlob);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("portfolio-assets")
        .getPublicUrl(fileName);

      onChange(data.publicUrl);
      toast({ title: "Profile picture updated" });
      setCropDialogOpen(false);
      setImageSrc(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-secondary border-2 border-border">
          {value ? (
            <>
              <img src={value} alt="Profile" className="w-full h-full object-cover" />
              <Button
                size="sm"
                variant="destructive"
                className="absolute bottom-0 right-0 h-6 w-6 p-0 rounded-full"
                onClick={handleRemove}
              >
                <X className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <label className="flex items-center justify-center w-full h-full cursor-pointer hover:bg-secondary/80 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-muted-foreground" />
            </label>
          )}
        </div>
        {!value && (
          <div className="text-sm text-muted-foreground">
            <p>Upload your profile picture</p>
            <p className="text-xs">Square, max 5MB</p>
          </div>
        )}
        {value && (
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <span className="text-sm text-primary hover:underline">Change photo</span>
          </label>
        )}
      </div>

      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="relative h-64 w-full rounded-lg overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Zoom</label>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(values) => setZoom(values[0])}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCropDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCropConfirm} disabled={uploading}>
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
