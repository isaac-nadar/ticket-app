"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createColumnAction, moveColumnAction } from "./actions";

import { moveCardAction } from "./actions";

import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";

import { CardDetailSheet } from "./card-detail-sheet";

import { Board } from "@/domain/board/board.type";
import { Column } from "@/domain/column/column.types";
import { Card } from "@/domain/card/card.types";

import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

export function BoardClient({
  initialBoard,
  userRole,
}: {
  initialBoard: Board;
  userRole: string;
}) {
  // 1. LOCAL STATE
  const [board, setBoard] = useState(initialBoard);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  // States for Add Column
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");
  const [isPendingCol, startColTransition] = useTransition();

  const [isPending, startTransition] = useTransition();

  const [activeColumn, setActiveColumn] = useState<Column | undefined>(
    undefined,
  );

  useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard]);

  // 2. SENSORS (Click protection)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // --- 3. THE STATE MACHINE ---

  const columnIds = board.columns.map((col) => col.id);

  // Fired the millisecond a user clicks and drags 5 pixels
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === "Column") {
      const col: Column | undefined = board.columns.find(
        (c) => c.id === active.id,
      );
      setActiveColumn(col);
      return;
    }
    // Find the exact card object from our state so we can draw the floating overlay
    const activeCol = board.columns.find((col: Column) =>
      col.cards.some((card: Card) => card.id === active.id),
    );
    const cardData = activeCol?.cards.find(
      (card: Card) => card.id === active.id,
    );
    setActiveCard(cardData || null);
  };

  // Fired continuously while the user drags the card around the screen
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Find which column the card is leaving, and which one it is entering
    const sourceColIndex = board.columns.findIndex((col: Column) =>
      col.cards.some((c: Card) => c.id === activeId),
    );
    // We check if 'over' is a column ID, or if it's another card's ID
    const destColIndex = board.columns.findIndex(
      (col: Column) =>
        col.id === overId || col.cards.some((c: Card) => c.id === overId),
    );

    if (sourceColIndex === -1 || destColIndex === -1) return;

    // If crossing into a NEW column, move it instantly (Optimistic UI)
    if (sourceColIndex !== destColIndex) {
      setBoard((prev: Board) => {
        const newColumns = [...prev.columns];
        const sourceCol = {
          ...newColumns[sourceColIndex],
          cards: [...newColumns[sourceColIndex].cards],
        };
        const destCol = {
          ...newColumns[destColIndex],
          cards: [...newColumns[destColIndex].cards],
        };

        // Remove from source
        const cardIndex = sourceCol.cards.findIndex(
          (c: Card) => c.id === activeId,
        );
        const [movedCard] = sourceCol.cards.splice(cardIndex, 1);

        // Add to destination
        destCol.cards.push(movedCard);

        newColumns[sourceColIndex] = sourceCol;
        newColumns[destColIndex] = destCol;

        return { ...prev, columns: newColumns };
      });
    }
  };

  // Fired when the user lets go of the mouse button
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    setActiveColumn(undefined);
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    if (active.data.current?.type === "Column") {
      const oldIndex = board.columns.findIndex((c) => c.id === active.id);
      const newIndex = board.columns.findIndex((c) => c.id === over.id);

      if (oldIndex !== newIndex) {
        const newColumns = arrayMove(board.columns, oldIndex, newIndex);
        setBoard({ ...board, columns: newColumns });

        startTransition(() => {
          moveColumnAction(board.id, active.id as string, newIndex);
        });
      }
      return;
    }

    // 1. We copy the CURRENT board state from the component's closure
    const newColumns = [...board.columns];

    // 2. VERTICAL SORTING: Only run arrayMove if we dropped it on a DIFFERENT card
    if (over && active.id !== over.id) {
      const activeColIndex = newColumns.findIndex((col: Column) =>
        col.cards.some((c: Card) => c.id === active.id),
      );
      const overColIndex = newColumns.findIndex(
        (col: Column) =>
          col.id === over.id || col.cards.some((c: Card) => c.id === over.id),
      );

      if (activeColIndex === overColIndex && activeColIndex !== -1) {
        const targetColumn = { ...newColumns[activeColIndex] };
        const oldIndex = targetColumn.cards.findIndex(
          (c: Card) => c.id === active.id,
        );
        const newIndex = targetColumn.cards.findIndex(
          (c: Card) => c.id === over.id,
        );

        targetColumn.cards = arrayMove(targetColumn.cards, oldIndex, newIndex);
        newColumns[activeColIndex] = targetColumn;
      }
    }

    // 3. Update the local React state instantly (NO side effects inside here!)
    setBoard({ ...board, columns: newColumns });

    // 👇 THE ARCHITECT'S TWEAK: Extract the exact diff to send to the server
    let targetColumnId = "";
    let targetPosition = 0;

    // Find exactly where the card ended up in our newly sorted array
    newColumns.forEach((col: Column) => {
      const index = col.cards.findIndex((c: Card) => c.id === active.id);
      if (index !== -1) {
        targetColumnId = col.id;
        targetPosition = index;
      }
    });

    startTransition(() => {
      if (targetColumnId) {
        moveCardAction(
          board.id,
          active.id as string,
          targetColumnId,
          targetPosition,
        );
      }
    });
  };

  const handleAddColumn = () => {
    if (!newColTitle.trim()) return;
    startColTransition(async () => {
      await createColumnAction(board.id, newColTitle);
      setNewColTitle("");
      setIsAddingCol(false);
    });
  };

  return (
    <>
      <DndContext
        id="kanban-board-dnd-context"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto p-4 flex gap-6 items-start h-full">
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            {board.columns.map((column: Column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                boardId={board.id}
                isCreator={userRole === "ADMIN"}
              />
            ))}
          </SortableContext>

          <div className="w-80 shrink-0">
            {isAddingCol ? (
              <div className="bg-muted/50 p-3 rounded-xl border border-border flex flex-col gap-2">
                <Input
                  autoFocus
                  placeholder="Enter column name..."
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
                  className="bg-card"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddColumn}
                    disabled={isPendingCol || !newColTitle.trim()}
                  >
                    {isPendingCol ? "Adding..." : "Add Column"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsAddingCol(false)}
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-14 bg-muted/20 border-dashed hover:bg-muted/50"
                onClick={() => setIsAddingCol(true)}
              >
                <PlusIcon className="size-4 mr-2" />
                Add another column
              </Button>
            )}
          </div>
        </div>

        {/* 4. THE GHOST: This draws the card while it's attached to the mouse! */}
        <DragOverlay>
          {activeCard ? (
            <div className="rotate-3 scale-105 transition-transform cursor-grabbing shadow-2xl">
              <KanbanCard card={activeCard} />
            </div>
          ) : null}

          {activeColumn ? (
            <KanbanColumn
              column={activeColumn}
              boardId={board.id}
              isCreator={true}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardDetailSheet board={board} />
    </>
  );
}
