"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher-client";
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
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
// 1. 👇 Add PanelLeft icons for the toggle
import { PlusIcon, XIcon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  createColumnAction,
  moveColumnAction,
  moveCardAction,
} from "./actions";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { CardDetailSheet } from "./card-detail-sheet";
import { BoardFilterBar } from "./board-filter-bar";
import { useBoardFilters } from "@/lib/hooks/use-board-filters";

import { Board } from "@/domain/board/board.type";
import { Column } from "@/domain/column/column.types";
import { Card } from "@/domain/card/card.types";

export function BoardClient({
  initialBoard,
  userRole,
  currentUserId,
}: {
  initialBoard: Board;
  userRole: string;
  currentUserId: string;
}) {
  const [board, setBoard] = useState(initialBoard);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | undefined>(
    undefined,
  );

  // 2. 👇 State for toggling the Backlog
  const [showBacklog, setShowBacklog] = useState(true);

  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");
  const [isPendingCol, startColTransition] = useTransition();
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const { filters } = useBoardFilters();

  // 3. 👇 Check if any filter is active so we can disable dragging
  const isFiltering = Object.values(filters).some((val) => val !== null);

  const allTags = new Set<string>();
  board.columns.forEach((col: Column) => {
    col.cards.forEach((card: Card) => {
      card.tags?.forEach((tag: string) => allTags.add(tag));
    });
  });
  const uniqueTags = Array.from(allTags);

  useEffect(() => {
    if (!pusherClient) return;

    const channelName = `board-${board.id}`;
    const channel = pusherClient.subscribe(channelName);
    channel.bind("board-updated", (data: { message: string }) => {
      router.refresh();
    });

    return () => {
      if (pusherClient) pusherClient.unsubscribe(channelName);
    };
  }, [board, router]);

  useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // --- DND HANDLERS (Untouched!) ---
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === "Column") {
      const col = board.columns.find((c) => c.id === active.id);
      setActiveColumn(col);
      return;
    }
    const activeCol = board.columns.find((col: Column) =>
      col.cards.some((card: Card) => card.id === active.id),
    );
    const cardData = activeCol?.cards.find(
      (card: Card) => card.id === active.id,
    );
    setActiveCard(cardData || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const sourceColIndex = board.columns.findIndex((col: Column) =>
      col.cards.some((c: Card) => c.id === activeId),
    );
    const destColIndex = board.columns.findIndex(
      (col: Column) =>
        col.id === overId || col.cards.some((c: Card) => c.id === overId),
    );

    if (sourceColIndex === -1 || destColIndex === -1) return;

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

        const cardIndex = sourceCol.cards.findIndex(
          (c: Card) => c.id === activeId,
        );
        const [movedCard] = sourceCol.cards.splice(cardIndex, 1);
        destCol.cards.push(movedCard);

        newColumns[sourceColIndex] = sourceCol;
        newColumns[destColIndex] = destCol;

        return { ...prev, columns: newColumns };
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    setActiveColumn(undefined);
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

    const newColumns = [...board.columns];

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

    setBoard({ ...board, columns: newColumns });

    let targetColumnId = "";
    let targetPosition = 0;
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
          active.data.current?.assigneeId,
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

  // --- FILTERING ---
  const filteredColumns = board.columns.map((col: Column) => {
    const filteredCards = col.cards.filter((card: Card) => {
      if (filters.assignee === "me" && card.assigneeId !== currentUserId)
        return false;
      if (
        filters.assignee &&
        filters.assignee !== "me" &&
        card.assigneeId !== filters.assignee
      )
        return false;
      if (filters.priority && card.priority !== filters.priority) return false;

      if (filters.date && card.dueDate) {
        const due = new Date(card.dueDate);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (
          filters.date === "today" &&
          due.toDateString() !== now.toDateString()
        )
          return false;
        if (
          filters.date === "tomorrow" &&
          due.toDateString() !== tomorrow.toDateString()
        )
          return false;
        if (filters.date === "week") {
          const nextWeek = new Date(now);
          nextWeek.setDate(now.getDate() + 7);
          if (due < now || due > nextWeek) return false;
        }
        if (
          filters.date === "month" &&
          (due.getMonth() !== now.getMonth() ||
            due.getFullYear() !== now.getFullYear())
        )
          return false;
      } else if (filters.date && !card.dueDate) {
        return false;
      }

      if (filters.created && card.createdAt) {
        const createdDate = new Date(card.createdAt);
        const now = new Date();
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const past7Days = new Date(startOfToday);
        past7Days.setDate(past7Days.getDate() - 7);
        const past30Days = new Date(startOfToday);
        past30Days.setDate(past30Days.getDate() - 30);
        const pastYear = new Date(startOfToday);
        pastYear.setFullYear(pastYear.getFullYear() - 1);

        if (filters.created === "today" && createdDate < startOfToday)
          return false;
        if (
          filters.created === "yesterday" &&
          (createdDate < startOfYesterday || createdDate >= startOfToday)
        )
          return false;
        if (filters.created === "week" && createdDate < past7Days) return false;
        if (filters.created === "month" && createdDate < past30Days)
          return false;
        if (filters.created === "year" && createdDate < pastYear) return false;
      }

      if (filters.tag && (!card.tags || !card.tags.includes(filters.tag))) {
        return false;
      }

      return true;
    });

    return { ...col, cards: filteredCards };
  });

  // 4. 👇 SPLIT THE DATA FOR THE NEW UI
  const backlogColumn = filteredColumns.find((c: Column) => c.isBacklog);
  const activeColumns = filteredColumns.filter((c: Column) => !c.isBacklog);
  const activeColumnIds = activeColumns.map((col: Column) => col.id);

  return (
    <div className="flex h-full flex-col">
      <BoardFilterBar
        boardUsers={initialBoard.users}
        currentUserId={currentUserId}
        availableTags={uniqueTags}
      />

      <DndContext
        id="kanban-board-dnd-context"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full overflow-hidden border-t">
          {/* ===================== */}
          {/* BACKLOG SIDEBAR       */}
          {/* ===================== */}
          {backlogColumn && showBacklog && (
            <div className="w-80 shrink-0 border-r bg-card flex flex-col transition-all">
              <div className="flex items-center justify-between p-3 border-b bg-muted/20">
                <span className="font-semibold text-sm">Product Backlog</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowBacklog(false)}
                >
                  <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
              <div className="p-3 flex-1 overflow-hidden flex flex-col min-h-0">
                <KanbanColumn
                  column={backlogColumn}
                  boardId={board.id}
                  boardPrefix={board.prefix}
                  isCreator={userRole === "ADMIN"}
                  isDragDisabled={isFiltering}
                />
              </div>
            </div>
          )}

          {/* ===================== */}
          {/* MAIN BOARD            */}
          {/* ===================== */}
          <div className="flex-1 flex flex-col min-w-0 bg-background/50">
            {backlogColumn && !showBacklog && (
              <div className="border-b p-2 bg-card">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBacklog(true)}
                  className="h-8 text-xs font-medium"
                >
                  <PanelLeftOpen className="w-4 h-4 mr-2" /> Open Backlog
                </Button>
              </div>
            )}

            <div className="flex-1 overflow-x-auto p-4 flex gap-6 items-start h-full">
              {/* NOTE: We only loop through activeColumnIds here! */}
              <SortableContext
                items={activeColumnIds}
                strategy={horizontalListSortingStrategy}
              >
                {activeColumns.map((column: Column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    boardId={board.id}
                    boardPrefix={board.prefix}
                    isCreator={userRole === "ADMIN"}
                    isDragDisabled={isFiltering}
                    availableTags={uniqueTags}
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
                    <PlusIcon className="size-4 mr-2" /> Add another column
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 5. THE GHOST OVERLAY */}
        <DragOverlay>
          {activeCard ? (
            <div className="rotate-3 scale-105 transition-transform cursor-grabbing shadow-2xl">
              <KanbanCard card={activeCard} boardPrefix={board.prefix} />
            </div>
          ) : null}

          {activeColumn ? (
            <KanbanColumn
              column={activeColumn}
              boardId={board.id}
              isCreator={true}
              boardPrefix={board.prefix}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardDetailSheet board={board} />
    </div>
  );
}
