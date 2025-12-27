import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "./ImageUpload";
import type { Testimonial } from "@/types/portfolio";

interface TestimonialsEditorProps {
  userId: string;
  testimonials: Testimonial[];
  onChange: (testimonials: Testimonial[]) => void;
}

export function TestimonialsEditor({
  userId,
  testimonials,
  onChange,
}: TestimonialsEditorProps) {
  const addTestimonial = () => {
    onChange([
      ...testimonials,
      {
        id: crypto.randomUUID(),
        name: "",
        role: "",
        company: "",
        content: "",
        photo_url: undefined,
      },
    ]);
  };

  const removeTestimonial = (id: string) => {
    onChange(testimonials.filter((t) => t.id !== id));
  };

  const updateTestimonial = (id: string, updates: Partial<Testimonial>) => {
    onChange(
      testimonials.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Testimonials
        </h3>
        <Button variant="ghost" size="sm" onClick={addTestimonial}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {testimonials.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No testimonials yet. Add testimonials from clients or colleagues.
        </p>
      )}

      <div className="space-y-4">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="w-16">
                <ImageUpload
                  userId={userId}
                  value={testimonial.photo_url || null}
                  onChange={(url) =>
                    updateTestimonial(testimonial.id, { photo_url: url || undefined })
                  }
                  aspectRatio="square"
                  placeholder="Photo"
                  className="w-16"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTestimonial(testimonial.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <Input
                value={testimonial.name}
                onChange={(e) =>
                  updateTestimonial(testimonial.id, { name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">Role</Label>
                <Input
                  value={testimonial.role}
                  onChange={(e) =>
                    updateTestimonial(testimonial.id, { role: e.target.value })
                  }
                  placeholder="CEO"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Company</Label>
                <Input
                  value={testimonial.company || ""}
                  onChange={(e) =>
                    updateTestimonial(testimonial.id, { company: e.target.value })
                  }
                  placeholder="Acme Inc"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Testimonial</Label>
              <Textarea
                value={testimonial.content}
                onChange={(e) =>
                  updateTestimonial(testimonial.id, { content: e.target.value })
                }
                placeholder="What they said about you..."
                className="min-h-[80px]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
