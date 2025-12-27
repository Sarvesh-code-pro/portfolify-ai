import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableSection } from "./SortableSection";
import type { SectionVisibility, SectionTitles } from "@/types/portfolio";

interface SectionManagerProps {
  sectionOrder: string[];
  sectionVisibility: SectionVisibility;
  sectionTitles: SectionTitles;
  onOrderChange: (order: string[]) => void;
  onVisibilityChange: (visibility: SectionVisibility) => void;
  onTitlesChange: (titles: SectionTitles) => void;
}

const DEFAULT_SECTIONS = ["hero", "about", "skills", "projects", "experience", "education", "testimonials", "contact"];

export function SectionManager({
  sectionOrder,
  sectionVisibility,
  sectionTitles,
  onOrderChange,
  onVisibilityChange,
  onTitlesChange,
}: SectionManagerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sectionOrder.indexOf(active.id as string);
      const newIndex = sectionOrder.indexOf(over.id as string);
      onOrderChange(arrayMove(sectionOrder, oldIndex, newIndex));
    }
  };

  const handleVisibilityToggle = (sectionId: string) => {
    onVisibilityChange({
      ...sectionVisibility,
      [sectionId]: !sectionVisibility[sectionId],
    });
  };

  const handleTitleChange = (sectionId: string, title: string) => {
    onTitlesChange({
      ...sectionTitles,
      [sectionId]: title,
    });
  };

  const orderedSections = sectionOrder.length > 0 
    ? sectionOrder.filter(s => DEFAULT_SECTIONS.includes(s))
    : DEFAULT_SECTIONS;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
        Section Management
      </h3>
      <p className="text-xs text-muted-foreground">
        Drag to reorder, toggle visibility, or rename sections
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedSections} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {orderedSections.map((sectionId) => (
              <SortableSection
                key={sectionId}
                id={sectionId}
                title={sectionTitles[sectionId] || sectionId}
                isVisible={sectionVisibility[sectionId] ?? true}
                onVisibilityToggle={() => handleVisibilityToggle(sectionId)}
                onTitleChange={(title) => handleTitleChange(sectionId, title)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
