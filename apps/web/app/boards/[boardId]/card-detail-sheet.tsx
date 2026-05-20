"use client";

import { useState, useEffect, useTransition, startTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { updateCardDetailsAction } from "./actions";
import { Bug, Sparkles } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/domain/card/card.types";
import { Board, BoardUser } from "@/domain/board/board.type";
import { UserAvatar } from "@/components/use-avatar";

export function CardDetailSheet({ board }: { board: Board }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCardId = searchParams.get("card");
  const isOpen = !!activeCardId;

  // Local state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [type, setType] = useState<"BUG" | "FEATURE">("FEATURE");
  const [isPending, startRequest] = useTransition();

  useEffect(() => {
    if (activeCardId && board) {
      for (const column of board.columns) {
        const foundCard = column.cards.find((c: Card) => c.id === activeCardId);
        if (foundCard) {
          startTransition(() => {
            setTitle(foundCard.title);
            setDescription(foundCard.description || "");
            setAssigneeId(foundCard.assigneeId || "unassigned");
            setType(foundCard.type || "FEATURE");
          });
          break;
        }
      }
    }
  }, [activeCardId, board]);

  const handleClose = () => {
    router.push(pathname, { scroll: false });
  };

  const handleSave = () => {
    if (!activeCardId || !title.trim()) return;

    startRequest(async () => {
      const parsedAssignee = assigneeId === "unassigned" ? null : assigneeId;

      await updateCardDetailsAction(board.id, activeCardId, {
        title,
        type,
        description,
        assigneeId: parsedAssignee,
      });

      handleClose(); // Close the sheet after saving
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] border-l-ui border-border bg-card text-card-foreground shadow-ui overflow-y-auto flex flex-col gap-6">
        <SheetHeader>
          <SheetDescription className="text-muted-foreground text-xs uppercase tracking-wider">
            Card Details
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 mt-2 flex-1">
          {/* TITLE INPUT */}
          <div className="flex flex-col gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold border-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-border rounded-none border-b"
            />
          </div>

          {/* TWO-COLUMN METADATA GRID (Assignee & Type) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {/* ASSIGNEE */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Assignee
              </Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="w-full border-ui bg-background">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent className="border-ui shadow-ui rounded-ui">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {board?.users?.map((bu: BoardUser) => (
                    <SelectItem key={bu.userId} value={bu.userId}>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={bu.user} className="size-5" />
                        <span>{bu.user.name || bu.user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 👇 TYPE */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Type
              </Label>
              <Select
                value={type}
                onValueChange={(val: "BUG" | "FEATURE") => setType(val)}
              >
                <SelectTrigger className="w-full border-ui bg-background">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="border-ui shadow-ui rounded-ui">
                  <SelectItem value="FEATURE">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      <span>Feature</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="BUG">
                    <div className="flex items-center gap-2">
                      <Bug className="size-4 text-destructive" />
                      <span>Bug</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DESCRIPTION INPUT */}
          <div className="flex flex-col gap-2 mt-4">
            <Label className="text-sm font-semibold">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a more detailed description..."
              className="min-h-[120px] bg-muted/50 resize-none border-ui"
            />
          </div>
        </div>

        {/* FOOTER ACTION */}
        <div className="flex justify-end pt-4 border-t border-border mt-auto">
          <Button onClick={handleSave} disabled={isPending || !title.trim()}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
