import { useState, useTransition } from "react";
// 1. Swap useDroppable for useSortable
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
// 2. Import CSS utility for the column sliding animation
import { CSS } from "@dnd-kit/utilities";
import { KanbanCard } from "./kanban-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// 3. Add GripHorizontal to your icons
import { PlusIcon, XIcon, GripHorizontal } from "lucide-react";
import { createCardAction } from "./actions";

import { Card } from "@/domain/card/card.types";
import { Column } from "@/domain/column/column.types";

export function KanbanColumn({
  column,
  boardId,
  isCreator, // 4. Add the RBAC permission prop!
}: {
  column: Column;
  boardId: string;
  isCreator?: boolean; // Made optional just in case it takes a second to load
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  // 5. Upgrade the Hook
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
    disabled: !isCreator, // If they aren't the creator, they can't drag it!
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

  // 6. The animation style for when the column moves
  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  // 7. Render a placeholder ghost when the column is being dragged
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        className="w-80 shrink-0 bg-muted/20 border-2 border-dashed border-border rounded-xl h-[500px] opacity-60"
      />
    );
  }

  return (
    <div
      ref={setNodeRef} // <-- Moved to the OUTER wrapper so the whole column is the target!
      style={style}
      className="flex flex-col gap-4 w-80 shrink-0 bg-muted/50 p-4 rounded-xl border border-border h-max max-h-full"
    >
      {/* HEADER */}
      <div className="font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* DRAG HANDLE (Only visible to Admin/Creator) */}
          {isCreator && (
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
      {/* Notice we removed ref={setNodeRef} from here, but kept the isOver highlight! */}
      <div
        className={`flex flex-col gap-3 min-h-[50px] rounded-lg transition-colors ${
          isOver ? "bg-muted/80 ring-2 ring-primary/20" : ""
        }`}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.map((card: Card) => (
            <KanbanCard key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>

      {/* INLINE ADD CARD FOOTER (Completely untouched) */}
      {isAdding ? (
        <div className="flex flex-col gap-2 mt-2">
          <Textarea
            autoFocus
            placeholder="Enter a title for this card..."
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
