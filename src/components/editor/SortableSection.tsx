import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface SortableSectionProps {
  id: string;
  title: string;
  isVisible: boolean;
  onVisibilityToggle: () => void;
  onTitleChange: (title: string) => void;
}

export function SortableSection({
  id,
  title,
  isVisible,
  onVisibilityToggle,
  onTitleChange,
}: SortableSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveTitle = () => {
    onTitleChange(editTitle);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 ${
        !isVisible ? "opacity-50" : ""
      }`}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={handleSaveTitle}>
            <Check className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm font-medium capitalize">{title}</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="w-3 h-3" />
          </Button>
        </div>
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={onVisibilityToggle}
        className="h-8 w-8 p-0"
      >
        {isVisible ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
