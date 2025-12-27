import { Plus, Trash2, GripVertical, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "./ImageUpload";
import type { Project } from "@/types/portfolio";

interface ProjectsEditorProps {
  userId: string;
  projects: Project[];
  onChange: (projects: Project[]) => void;
}

export function ProjectsEditor({
  userId,
  projects,
  onChange,
}: ProjectsEditorProps) {
  const addProject = () => {
    onChange([
      ...projects,
      {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        technologies: [],
        link: "",
        images: [],
        featured_image: undefined,
      },
    ]);
  };

  const removeProject = (id: string) => {
    onChange(projects.filter((p) => p.id !== id));
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    onChange(
      projects.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const addImage = (projectId: string, url: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      const newImages = [...project.images, url];
      updateProject(projectId, {
        images: newImages,
        featured_image: project.featured_image || url,
      });
    }
  };

  const removeImage = (projectId: string, index: number) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      const newImages = project.images.filter((_, i) => i !== index);
      const removedImage = project.images[index];
      updateProject(projectId, {
        images: newImages,
        featured_image:
          project.featured_image === removedImage
            ? newImages[0]
            : project.featured_image,
      });
    }
  };

  const setFeaturedImage = (projectId: string, url: string) => {
    updateProject(projectId, { featured_image: url });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Projects
        </h3>
        <Button variant="ghost" size="sm" onClick={addProject}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-4">
        {projects.map((project, index) => (
          <div
            key={project.id || index}
            className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-3"
          >
            <div className="flex items-start justify-between">
              <GripVertical className="w-4 h-4 text-muted-foreground mt-2 cursor-grab" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeProject(project.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Project Name</Label>
              <Input
                value={project.title}
                onChange={(e) =>
                  updateProject(project.id, { title: e.target.value })
                }
                placeholder="Project name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={project.description}
                onChange={(e) =>
                  updateProject(project.id, { description: e.target.value })
                }
                placeholder="What does it do?"
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Technologies</Label>
              <Input
                value={project.technologies.join(", ")}
                onChange={(e) =>
                  updateProject(project.id, {
                    technologies: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="React, TypeScript, Node.js..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Project URL</Label>
              <Input
                value={project.link}
                onChange={(e) =>
                  updateProject(project.id, { link: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            {/* Project Images */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Project Images
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {project.images.map((url, idx) => (
                  <div
                    key={idx}
                    className={`relative aspect-video rounded overflow-hidden bg-secondary cursor-pointer ${
                      project.featured_image === url
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => setFeaturedImage(project.id, url)}
                    title="Click to set as featured"
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(project.id, idx);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    {project.featured_image === url && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                ))}
                {project.images.length < 5 && (
                  <ImageUpload
                    userId={userId}
                    value={null}
                    onChange={(url) => url && addImage(project.id, url)}
                    aspectRatio="wide"
                    placeholder="Add image"
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Click an image to set as featured. Max 5 images.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
