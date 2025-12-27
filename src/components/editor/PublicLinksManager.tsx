import { useState, useEffect } from "react";
import { Plus, Trash2, Copy, ExternalLink, Eye, EyeOff, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PortfolioLink, SectionVisibility } from "@/types/portfolio";

interface PublicLinksManagerProps {
  portfolioId: string;
  userId: string;
  defaultSectionVisibility: SectionVisibility;
}

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  about: "About",
  skills: "Skills",
  projects: "Projects",
  experience: "Experience",
  education: "Education",
  testimonials: "Testimonials",
  contact: "Contact",
};

export function PublicLinksManager({
  portfolioId,
  userId,
  defaultSectionVisibility,
}: PublicLinksManagerProps) {
  const [links, setLinks] = useState<PortfolioLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkSlug, setNewLinkSlug] = useState("");
  const [newLinkVisibility, setNewLinkVisibility] = useState<SectionVisibility>(defaultSectionVisibility);
  const { toast } = useToast();

  useEffect(() => {
    fetchLinks();
  }, [portfolioId]);

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from("portfolio_links")
      .select("*")
      .eq("portfolio_id", portfolioId)
      .eq("user_id", userId);

    if (!error && data) {
      setLinks(data.map(link => ({
        ...link,
        section_visibility: link.section_visibility as SectionVisibility
      })));
    }
    setLoading(false);
  };

  const createLink = async () => {
    if (!newLinkName.trim() || !newLinkSlug.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    const slug = newLinkSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    const { error } = await supabase.from("portfolio_links").insert({
      portfolio_id: portfolioId,
      user_id: userId,
      name: newLinkName,
      slug,
      section_visibility: newLinkVisibility,
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "This link slug is already taken", variant: "destructive" });
      } else {
        toast({ title: "Failed to create link", variant: "destructive" });
      }
      return;
    }

    toast({ title: "Link created successfully" });
    setCreateDialogOpen(false);
    setNewLinkName("");
    setNewLinkSlug("");
    setNewLinkVisibility(defaultSectionVisibility);
    fetchLinks();
  };

  const toggleLinkActive = async (link: PortfolioLink) => {
    const { error } = await supabase
      .from("portfolio_links")
      .update({ is_active: !link.is_active })
      .eq("id", link.id);

    if (!error) {
      fetchLinks();
    }
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase.from("portfolio_links").delete().eq("id", id);
    if (!error) {
      toast({ title: "Link deleted" });
      fetchLinks();
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/link/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Public Links
        </h3>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Create Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Public Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Link Name</Label>
                <Input
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  placeholder="e.g., For Recruiters"
                />
              </div>

              <div className="space-y-2">
                <Label>Link Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/link/</span>
                  <Input
                    value={newLinkSlug}
                    onChange={(e) => setNewLinkSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder="my-portfolio"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Visible Sections</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(SECTION_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={`visibility-${key}`}
                        checked={newLinkVisibility[key] ?? true}
                        onCheckedChange={(checked) =>
                          setNewLinkVisibility({
                            ...newLinkVisibility,
                            [key]: !!checked,
                          })
                        }
                      />
                      <label htmlFor={`visibility-${key}`} className="text-sm">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={createLink} className="w-full">
                Create Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-xs text-muted-foreground">
        Create multiple links with different visible sections for different audiences.
      </p>

      {loading ? (
        <div className="text-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : links.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No custom links yet. Create one to share specific sections.
        </p>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{link.name}</span>
                  {!link.is_active && (
                    <span className="text-xs px-2 py-0.5 bg-destructive/20 text-destructive rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleLinkActive(link)}
                    title={link.is_active ? "Deactivate" : "Activate"}
                  >
                    {link.is_active ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => copyLink(link.slug)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    asChild
                  >
                    <a
                      href={`/link/${link.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => deleteLink(link.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                /link/{link.slug}
              </p>
              <p className="text-xs text-muted-foreground">
                Views: {link.view_count}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
