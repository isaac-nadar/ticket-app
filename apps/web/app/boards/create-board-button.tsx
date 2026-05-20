"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Import the server action we just wrote!
import { createBoardAction } from "./actions";

export function CreateBoardButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!boardName.trim()) {
      setError("Board name is required.");
      return;
    }

    // Fire the Server Action safely in the background
    startTransition(async () => {
      const res = await createBoardAction(boardName);

      if (res.success && res.boardId) {
        setIsOpen(false);
        setBoardName(""); // Reset the form

        // ⚡ INSTANT ROUTING: Teleport the Admin straight to their new board!
        router.push(`/boards/${res.boardId}`);
      } else {
        setError(res.error || "Failed to create board.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-sm">
          <Plus className="size-4 mr-2" />
          Create Board
        </Button>
      </DialogTrigger>

      {/* Notice how we use your semantic tokens to keep it styled perfectly! */}
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-ui border-border shadow-ui rounded-ui">
        <DialogHeader>
          <DialogTitle>Create a new board</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex flex-col gap-5 mt-4">
          {error && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Board Name</Label>
            <Input
              id="name"
              placeholder="e.g., Q3 Product Roadmap"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !boardName.trim()}>
              {isPending ? "Creating..." : "Create Board"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
