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
import { Card, Comment } from "@/domain/card/card.types";
import { Board, BoardUser } from "@/domain/board/board.type";
import { UserAvatar } from "@/components/use-avatar";

import { addCommentAction, getCardCommentsAction } from "./actions";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, startCommentRequest] = useTransition();
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    if (activeCardId && board) {
      // 1. INSTANT LOAD: Find card from local board state (Title, Desc, Assignee)
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

      // 2. LAZY LOAD: Fetch comments from the server
      let isMounted = true; // Cleanup flag to prevent race conditions
      startTransition(() => {
        setIsLoadingComments(true);
        setComments([]); // Clear old comments while fetching
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getCardCommentsAction(activeCardId).then((res: any) => {
        if (isMounted && res.success && res.data) {
          setComments(res.data);
          setIsLoadingComments(false);
        }
      });

      return () => {
        isMounted = false;
      };
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

  const handleAddComment = () => {
    if (!activeCardId || !newComment.trim()) return;

    startCommentRequest(async () => {
      // 👇 Pass the single object payload to our Safe Action!
      await addCommentAction({
        boardId: board.id,
        cardId: activeCardId,
        text: newComment,
      });
      setNewComment(""); // Clear input on success
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] border-l-ui border-border bg-card text-card-foreground shadow-ui overflow-y-auto flex flex-col gap-6">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 border-b border-border">
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

          {/* COMMENT FEED */}
          <div className="flex flex-col gap-4 mt-6">
            <Label className="text-sm font-semibold border-b border-border pb-2">
              Activity
            </Label>

            {isLoadingComments ? (
              <div className="flex flex-col gap-4 mt-2">
                {/* Tailwind Loading Skeletons */}
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="size-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 bg-muted rounded" />
                      <div className="h-4 w-full bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No comments yet.
              </p>
            ) : (
              <div className="flex flex-col gap-5 mt-2">
                {comments.map((comment: Comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <UserAvatar user={comment.user} className="size-8" />
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {comment.user.name || comment.user.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-card-foreground whitespace-pre-wrap">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER ACTION */}
        <div className="p-4 bg-muted/30 flex flex-col gap-3">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none bg-background border-ui"
          />
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isPending || !title.trim()}
            >
              {isPending ? "Saving Card..." : "Save Card Details"}
            </Button>
            <Button
              onClick={handleAddComment}
              disabled={isCommenting || !newComment.trim()}
            >
              {isCommenting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
