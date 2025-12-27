import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "./ImageUpload";
import { Globe, Share2 } from "lucide-react";
import type { SEOSettings } from "@/types/portfolio";

interface SEOEditorProps {
  userId: string;
  username: string;
  seoSettings: SEOSettings;
  heroTitle: string | null;
  heroSubtitle: string | null;
  onChange: (settings: SEOSettings) => void;
}

export function SEOEditor({
  userId,
  username,
  seoSettings,
  heroTitle,
  heroSubtitle,
  onChange,
}: SEOEditorProps) {
  const updateSettings = (updates: Partial<SEOSettings>) => {
    onChange({ ...seoSettings, ...updates });
  };

  const displayTitle = seoSettings.meta_title || heroTitle || "Portfolio";
  const displayDescription =
    seoSettings.meta_description || heroSubtitle || "Professional portfolio";
  const previewUrl = `${window.location.origin}/p/${username}`;

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
        SEO & Sharing
      </h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Meta Title</Label>
          <Input
            value={seoSettings.meta_title || ""}
            onChange={(e) => updateSettings({ meta_title: e.target.value || null })}
            placeholder={heroTitle || "Your Name | Portfolio"}
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground">
            {(seoSettings.meta_title || "").length}/60 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label>Meta Description</Label>
          <Textarea
            value={seoSettings.meta_description || ""}
            onChange={(e) =>
              updateSettings({ meta_description: e.target.value || null })
            }
            placeholder={heroSubtitle || "A brief description of your portfolio..."}
            maxLength={160}
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">
            {(seoSettings.meta_description || "").length}/160 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label>Custom Favicon</Label>
          <ImageUpload
            userId={userId}
            value={seoSettings.favicon_url || null}
            onChange={(url) => updateSettings({ favicon_url: url })}
            aspectRatio="square"
            placeholder="Upload favicon"
            className="w-20"
          />
          <p className="text-xs text-muted-foreground">
            Square image, will be resized to 32x32
          </p>
        </div>

        <div className="space-y-2">
          <Label>Social Share Image (OG Image)</Label>
          <ImageUpload
            userId={userId}
            value={seoSettings.og_image_url || null}
            onChange={(url) => updateSettings({ og_image_url: url })}
            aspectRatio="wide"
            placeholder="Upload share image"
          />
          <p className="text-xs text-muted-foreground">
            Recommended: 1200x630 pixels
          </p>
        </div>
      </div>

      {/* Link Preview */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-muted-foreground" />
          <Label>Link Preview</Label>
        </div>
        <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-2">
          {seoSettings.og_image_url && (
            <div className="aspect-video rounded overflow-hidden bg-secondary">
              <img
                src={seoSettings.og_image_url}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <p className="text-sm font-medium line-clamp-1">{displayTitle}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {displayDescription}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="w-3 h-3" />
            <span className="truncate">{previewUrl}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
