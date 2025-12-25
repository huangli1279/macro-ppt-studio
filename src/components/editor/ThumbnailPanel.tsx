"use client";

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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SlideData, PPTReport } from "@/types/slide";
import { SlideRenderer } from "@/components/slide";

interface ThumbnailItemProps {
  slide: SlideData;
  index: number;
  isSelected: boolean;
  isReadOnly?: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableThumbnail({
  id,
  slide,
  index,
  isSelected,
  isReadOnly,
  onClick,
  onEdit,
  onDelete,
}: ThumbnailItemProps & { id: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id, disabled: isReadOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${isSelected
        ? "border-blue-500 shadow-md"
        : "border-transparent hover:border-slate-300"
        }`}
      onClick={onClick}
    >
      {/* Thumbnail preview */}
      <div className="w-full aspect-video bg-white overflow-hidden pointer-events-none relative">
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: 'scale(0.133)',
            transformOrigin: 'center center',
          }}
        >
          <div style={{ width: '960px', height: '540px' }}>
            <SlideRenderer slide={slide} pageNumber={index + 1} isThumbnail />
          </div>
        </div>
      </div>

      {/* Slide number badge */}
      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
        {index + 1}
      </div>

      {/* Edit menu - shows on hover */}
      {!isReadOnly && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6 bg-black/60 hover:bg-black/80"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

interface InsertButtonProps {
  onClick: () => void;
}

function InsertButton({ onClick }: InsertButtonProps) {
  return (
    <div className="relative h-2 group">
      <button
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-blue-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
        onClick={onClick}
      >
        <Plus className="h-3 w-3" />
      </button>
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

interface ThumbnailPanelProps {
  slides: PPTReport;
  selectedIndex: number;
  onSelectSlide: (index: number) => void;
  onSlidesChange: (slides: PPTReport) => void;
  onAddSlide: (insertIndex?: number) => void;
  onEditSlide: (index: number) => void;
  onSave?: (slides: PPTReport) => void;
  isReadOnly?: boolean;
}

export function ThumbnailPanel({
  slides,
  selectedIndex,
  onSelectSlide,
  onSlidesChange,
  onAddSlide,
  onEditSlide,
  onSave,
  isReadOnly,
}: ThumbnailPanelProps) {
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((_, i) => `slide-${i}` === active.id);
      const newIndex = slides.findIndex((_, i) => `slide-${i}` === over.id);

      const newSlides = arrayMove(slides, oldIndex, newIndex);
      onSlidesChange(newSlides);

      // Update selected index if needed
      if (selectedIndex === oldIndex) {
        onSelectSlide(newIndex);
      } else if (selectedIndex > oldIndex && selectedIndex <= newIndex) {
        onSelectSlide(selectedIndex - 1);
      } else if (selectedIndex < oldIndex && selectedIndex >= newIndex) {
        onSelectSlide(selectedIndex + 1);
      }
    }
  };

  const handleDeleteSlide = (index: number) => {
    setDeleteConfirmIndex(index);
  };

  const confirmDelete = () => {
    if (deleteConfirmIndex === null) return;

    const newSlides = slides.filter((_, i) => i !== deleteConfirmIndex);
    onSlidesChange(newSlides);
    if (onSave) {
      onSave(newSlides);
    }

    // Update selected index
    if (selectedIndex >= newSlides.length) {
      onSelectSlide(Math.max(0, newSlides.length - 1));
    } else if (selectedIndex > deleteConfirmIndex) {
      onSelectSlide(selectedIndex - 1);
    }

    setDeleteConfirmIndex(null);
  };

  return (
    <div className="w-32 flex flex-col bg-slate-100 border-r border-slate-200">
      <ScrollArea className="flex-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="p-2 space-y-1">
            {/* Add button at top - only show when no slides */}
            {slides.length === 0 && !isReadOnly && (
              <button
                className="w-full aspect-video rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center"
                onClick={() => onAddSlide(0)}
              >
                <Plus className="h-6 w-6 text-slate-400" />
              </button>
            )}

            {/* Sortable slides */}
            <SortableContext
              items={slides.map((_, i) => `slide-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              {slides.map((slide, index) => (
                <div key={`slide-${index}`}>
                  {index === 0 && !isReadOnly && (
                    <InsertButton onClick={() => onAddSlide(0)} />
                  )}
                  <SortableThumbnail
                    id={`slide-${index}`}
                    slide={slide}
                    index={index}
                    isSelected={selectedIndex === index}
                    isReadOnly={isReadOnly}
                    onClick={() => onSelectSlide(index)}
                    onEdit={() => onEditSlide(index)}
                    onDelete={() => handleDeleteSlide(index)}
                  />
                  {index < slides.length - 1 && !isReadOnly && (
                    <InsertButton onClick={() => onAddSlide(index + 1)} />
                  )}
                </div>
              ))}
            </SortableContext>

            {/* Add button at bottom if there are slides */}
            {slides.length > 0 && !isReadOnly && (
              <button
                className="w-full aspect-video rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center"
                onClick={() => onAddSlide()}
              >
                <Plus className="h-6 w-6 text-slate-400" />
              </button>
            )}
          </div>
        </DndContext>
      </ScrollArea>

      <Dialog open={deleteConfirmIndex !== null} onOpenChange={(open) => !open && setDeleteConfirmIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除这张幻灯片吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

