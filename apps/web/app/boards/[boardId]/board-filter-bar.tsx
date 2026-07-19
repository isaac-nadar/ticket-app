"use client";

import { useBoardFilters } from "@/lib/hooks/use-board-filters";
import { Button } from "@/components/ui/button";
import { Filter, X, Calendar, Flag, User, Clock, Hash } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BoardUser } from "@/domain/board/board.type";

export function BoardFilterBar({
  boardUsers,
  currentUserId,
  availableTags = [],
}: {
  boardUsers: BoardUser[];
  currentUserId: string;
  availableTags: string[];
}) {
  const { filters, setFilter, clearFilters } = useBoardFilters();

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border bg-card p-2 shadow-sm">
      <div className="flex items-center gap-2 px-2 text-sm font-medium text-muted-foreground border-r pr-4">
        <Filter className="h-4 w-4" />
        Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
      </div>

      {/* 1. Quick "My Cards" Toggle */}
      <Button
        variant={filters.assignee === "me" ? "secondary" : "ghost"}
        size="sm"
        onClick={() =>
          setFilter("assignee", filters.assignee === "me" ? null : "me")
        }
        className="h-8 gap-2"
      >
        <User className="h-4 w-4" />
        Assigned to me
      </Button>

      {/* 2. Priority Filter */}
      <Select
        value={filters.priority || ""}
        onValueChange={(v) => setFilter("priority", v === "all" ? null : v)}
      >
        <SelectTrigger className="h-8 w-[140px] border-dashed">
          <div className="flex items-center gap-2">
            <Flag className="h-3.5 w-3.5" />{" "}
            <SelectValue placeholder="Priority" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any Priority</SelectItem>
          <SelectItem value="URGENT">Urgent</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
        </SelectContent>
      </Select>

      {availableTags.length > 0 && (
        <Select
          value={filters.tag || ""}
          onValueChange={(v) => setFilter("tag", v === "all" ? null : v)}
        >
          <SelectTrigger className="h-8 w-[140px] border-dashed">
            <div className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5" />{" "}
              <SelectValue placeholder="Tags" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {availableTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* 3. Date Filter */}
      {/* <Select
        value={filters.date || ""}
        onValueChange={(v) => setFilter("date", v === "all" ? null : v)}
      >
        <SelectTrigger className="h-8 w-[150px] border-dashed">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />{" "}
            <SelectValue placeholder="Due Date" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any Date</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="tomorrow">Tomorrow</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="quarter">This Quarter</SelectItem>
        </SelectContent>
      </Select> */}

      <Select
        value={filters.created || ""}
        onValueChange={(v) => setFilter("created", v === "all" ? null : v)}
      >
        <SelectTrigger className="h-8 w-[150px] border-dashed">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />{" "}
            <SelectValue placeholder="Created" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any Time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="week">Past 7 Days</SelectItem>
          <SelectItem value="month">Past 30 Days</SelectItem>
          <SelectItem value="year">Past Year</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="ml-auto h-8 text-muted-foreground hover:text-red-600"
        >
          Clear <X className="ml-1 h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
