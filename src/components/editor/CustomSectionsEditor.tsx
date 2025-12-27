import { Plus, Trash2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "./ImageUpload";
import type { CustomSection } from "@/types/portfolio";

interface CustomSectionsEditorProps {
  userId: string;
  sections: CustomSection[];
  onChange: (sections: CustomSection[]) => void;
  onAddToOrder: (sectionId: string) => void;
  onRemoveFromOrder: (sectionId: string) => void;
}

export function CustomSectionsEditor({
  userId,
  sections,
  onChange,
  onAddToOrder,
  onRemoveFromOrder,
}: CustomSectionsEditorProps) {
  const addSection = () => {
    const newSection: CustomSection = {
      id: `custom-${crypto.randomUUID().slice(0, 8)}`,
      title: "New Section",
      content: "",
      media: [],
      links: [],
    };
    onChange([...sections, newSection]);
    onAddToOrder(newSection.id);
  };

  const removeSection = (id: string) => {
    onChange(sections.filter((s) => s.id !== id));
    onRemoveFromOrder(id);
  };

  const updateSection = (id: string, updates: Partial<CustomSection>) => {
    onChange(
      sections.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const addLink = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (section) {
      updateSection(sectionId, {
        links: [...section.links, { label: "", url: "" }],
      });
    }
  };

  const updateLink = (
    sectionId: string,
    linkIndex: number,
    updates: { label?: string; url?: string }
  ) => {
    const section = sections.find((s) => s.id === sectionId);
    if (section) {
      const newLinks = [...section.links];
      newLinks[linkIndex] = { ...newLinks[linkIndex], ...updates };
      updateSection(sectionId, { links: newLinks });
    }
  };

  const removeLink = (sectionId: string, linkIndex: number) => {
    const section = sections.find((s) => s.id === sectionId);
    if (section) {
      updateSection(sectionId, {
        links: section.links.filter((_, i) => i !== linkIndex),
      });
    }
  };

  const addMedia = (sectionId: string, url: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (section) {
      updateSection(sectionId, {
        media: [...section.media, url],
      });
    }
  };

  const removeMedia = (sectionId: string, mediaIndex: number) => {
    const section = sections.find((s) => s.id === sectionId);
    if (section) {
      updateSection(sectionId, {
        media: section.media.filter((_, i) => i !== mediaIndex),
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Custom Sections
        </h3>
        <Button variant="ghost" size="sm" onClick={addSection}>
          <Plus className="w-4 h-4 mr-1" /> Add Section
        </Button>
      </div>

      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Create custom sections for awards, publications, hobbies, etc.
        </p>
      )}

      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Input
                value={section.title}
                onChange={(e) =>
                  updateSection(section.id, { title: e.target.value })
                }
                placeholder="Section Title"
                className="max-w-[200px] font-medium"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSection(section.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Content</Label>
              <Textarea
                value={section.content}
                onChange={(e) =>
                  updateSection(section.id, { content: e.target.value })
                }
                placeholder="Write your content here..."
                className="min-h-[100px]"
              />
            </div>

            {/* Media */}
            <div className="space-y-2">
              <Label className="text-xs">Media</Label>
              <div className="grid grid-cols-3 gap-2">
                {section.media.map((url, idx) => (
                  <div key={idx} className="relative aspect-video rounded overflow-hidden bg-secondary">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => removeMedia(section.id, idx)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <ImageUpload
                  userId={userId}
                  value={null}
                  onChange={(url) => url && addMedia(section.id, url)}
                  aspectRatio="wide"
                  placeholder="Add"
                />
              </div>
            </div>

            {/* Links */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Links</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => addLink(section.id)}
                >
                  <LinkIcon className="w-3 h-3 mr-1" /> Add Link
                </Button>
              </div>
              {section.links.map((link, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={link.label}
                    onChange={(e) =>
                      updateLink(section.id, idx, { label: e.target.value })
                    }
                    placeholder="Label"
                    className="flex-1"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) =>
                      updateLink(section.id, idx, { url: e.target.value })
                    }
                    placeholder="URL"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(section.id, idx)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
