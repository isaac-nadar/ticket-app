"use client";

import { useState, useTransition } from "react";
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

import { updateKanbanColumns } from "./actions";

import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";

import { Board } from "@/domain/board/board.type";
import { Column } from "@/domain/column/column.types";
import { Card } from "@/domain/card/card.types";

export function BoardClient({ initialBoard }: { initialBoard: Board }) {
  // 1. LOCAL STATE
  const [board, setBoard] = useState(initialBoard);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const [isPending, startTransition] = useTransition();

  // 2. SENSORS (Click protection)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // --- 3. THE STATE MACHINE ---

  // Fired the millisecond a user clicks and drags 5 pixels
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
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
    const { active, over } = event;

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

    // 4. Fire the Server Action safely outside the render cycle
    startTransition(() => {
      updateKanbanColumns(board.id, newColumns);
    });
  };

  return (
    <DndContext
      id="kanban-board-dnd-context"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-x-auto p-4 flex gap-6 items-start h-full">
        {board.columns.map((column: Column) => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </div>

      {/* 4. THE GHOST: This draws the card while it's attached to the mouse! */}
      <DragOverlay>
        {activeCard ? (
          <div className="rotate-3 scale-105 transition-transform cursor-grabbing shadow-2xl">
            <KanbanCard card={activeCard} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
