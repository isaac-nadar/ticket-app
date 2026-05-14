import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanCard } from "./kanban-card";
import { Card } from "@/domain/card/card.types";
import { Column } from "@/domain/column/column.types";

export function KanbanColumn({ column }: { column: Column }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "Column", column },
  });

  // Extract just the IDs for the SortableContext
  const cardIds = column.cards.map((card: Card) => card.id);

  return (
    <div className="flex flex-col gap-4 w-80 shrink-0 bg-muted/50 p-4 rounded-xl border border-border">
      <div className="font-semibold flex items-center justify-between">
        <span>{column.name}</span>
        <span className="text-muted-foreground text-sm bg-background px-2 py-1 rounded-md">
          {column.cards.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-3 min-h-[200px] rounded-lg transition-colors ${
          isOver ? "bg-muted/50 ring-2 ring-primary/20" : ""
        }`}
      >
        {/* Wrap the cards in SortableContext */}
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.map((card: Card) => (
            <KanbanCard key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
