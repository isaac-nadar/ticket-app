import { useState, useTransition } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCard } from "./kanban-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, XIcon, GripHorizontal } from "lucide-react";
import { createCardAction } from "./actions";

// Add isBacklog to the type if it isn't in your global types yet
import { Card } from "@/domain/card/card.types";
import { Column } from "@/domain/column/column.types";

export function KanbanColumn({
  column,
  boardId,
  boardPrefix = null,
  isCreator,
  isDragDisabled, // 👈 1. Added this prop to handle filters!
  availableTags = [],
}: {
  column: Column & { isBacklog?: boolean }; // 👈 2. Ensure TypeScript knows about the backlog flag
  boardId: string;
  boardPrefix: string | null;
  isCreator?: boolean;
  isDragDisabled?: boolean;
  availableTags?: string[];
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: column.id,
    data: { type: "Column", column },
    // 👈 3. THE MAGIC: Disable dragging if they lack permissions, if filters are active, OR if it's the backlog!
    disabled: !isCreator || column.isBacklog || isDragDisabled,
  });

  const cardIds = column.cards.map((card: Card) => card.id);

  const handleAddCard = () => {
    if (!newCardTitle.trim()) return;

    startTransition(async () => {
      await createCardAction(boardId, column.id, newCardTitle);
      setNewCardTitle("");
      setIsAdding(false);
    });
  };

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        className="w-80 shrink-0 bg-muted/20 border-2 border-dashed border-border rounded-xl h-[500px] opacity-60"
      />
    );
  }

  // 👈 4. DYNAMIC STYLING: Make standard columns look like cards, but make the backlog fill the sidebar cleanly
  const containerClasses = column.isBacklog
    ? "flex flex-col gap-3 w-full h-full min-h-0"
    : "flex flex-col gap-3 w-80 shrink-0 bg-muted/50 p-3 rounded-xl border border-border max-h-full min-h-0";
  // (Note: Changed p-4 to p-3 to match backlog spacing, and removed h-max)

  return (
    <div ref={setNodeRef} style={style} className={containerClasses}>
      {/* HEADER */}
      <div className="font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 👈 5. Hide the drag grip if it is the backlog column */}
          {isCreator && !column.isBacklog && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
            >
              <GripHorizontal className="size-4" />
            </div>
          )}
          <span>{column.name}</span>
        </div>
        <span className="text-muted-foreground text-sm bg-background px-2 py-1 rounded-md">
          {column.cards.length}
        </span>
      </div>

      {/* DROP ZONE FOR CARDS */}
      <div
        className={`flex-1 overflow-y-auto min-h-0 pr-1 flex flex-col gap-3 rounded-lg transition-colors ${
          isOver ? "bg-muted/80 ring-2 ring-primary/20" : ""
        }`}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.map((card: Card) => (
            <KanbanCard
              key={card.id}
              card={card}
              boardPrefix={boardPrefix}
              // isDragDisabled={isDragDisabled}
            />
          ))}
        </SortableContext>
      </div>

      {/* INLINE ADD CARD FOOTER */}
      {isAdding ? (
        <div className="flex flex-col gap-2 mt-2">
          <Textarea
            autoFocus
            placeholder="Card title... (Pro tip: use #tags)"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddCard();
              }
            }}
            className="min-h-[80px] bg-card resize-none"
          />
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setNewCardTitle((prev) => `${prev} ${tag}`)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground hover:bg-blue-100 hover:text-blue-700 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAddCard}
              disabled={isPending || !newCardTitle.trim()}
            >
              {isPending ? "Adding..." : "Add Card"}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsAdding(false)}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground mt-2"
          onClick={() => setIsAdding(true)}
        >
          <PlusIcon className="size-4 mr-2" />
          Add a card
        </Button>
      )}
    </div>
  );
}
