"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, CreditCard } from "lucide-react";
import { searchCardsAction } from "@/app/actions/search-actions";
import { useDebounce } from "@/lib/hooks/use-debounce";

// 1. Import explicit Command primitives
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// 2. Import explicit Dialog primitives
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/domain/card/card.types";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    async function performSearch() {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await searchCardsAction(debouncedQuery);
        if (res?.success && res.data) {
          setResults(res.data);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [debouncedQuery]);

  const handleSelect = (boardId: string | undefined, cardId: string) => {
    if (!boardId) {
      return;
    }
    setOpen(false);
    setSearchQuery("");
    router.push(`/boards/${boardId}?card=${cardId}`);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-ui border-ui border-input bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Search className="h-4 w-4" />
        <span>Search cards...</span>
        <kbd className="pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded-ui border-ui bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* 👇 THE FIX: Explicitly wrap the Command component inside the Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-ui sm:max-w-[500px]">
          {/* Accessibility Header required by screen readers */}
          <DialogHeader className="sr-only">
            <DialogTitle>Global Search</DialogTitle>
            <DialogDescription>
              Search for cards across all your assigned Kanban boards.
            </DialogDescription>
          </DialogHeader>

          {/* Explicit Command Root Provider */}
          <Command className="w-full bg-transparent">
            <CommandInput
              placeholder="Search for cards by title or description..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isLoading && (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isLoading &&
                debouncedQuery.length >= 2 &&
                results.length === 0 && (
                  <CommandEmpty>No cards found.</CommandEmpty>
                )}

              {results.length > 0 && (
                <CommandGroup heading="Cards">
                  {results.map((card) => (
                    <CommandItem
                      key={card.id}
                      value={`${card.title} ${card.id}`}
                      onSelect={() => handleSelect(card.boardId, card.id)}
                      className="flex flex-col items-start gap-1 py-3"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <CreditCard className="h-4 w-4 text-blue-500" />
                        {card.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-ui bg-muted px-1.5 py-0.5 border-ui">
                          Board: {card.board?.title || "Unknown"}
                        </span>
                        {card.assigneeId && <span>• Assigned</span>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
