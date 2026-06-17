"use client";

import { useState, useEffect, useTransition, startTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getCardDetailsAction, updateCardDetailsAction } from "./actions";
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
import { Attachment, Card, Comment } from "@/domain/card/card.types";
import { Board, BoardUser } from "@/domain/board/board.type";
import { UserAvatar } from "@/components/use-avatar";

import { addCommentAction } from "./actions";
import { formatDistanceToNow } from "date-fns";
import { FileUploadZone } from "@/components/file-upload-zone";

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
  const [card, setCard] = useState<Card | null>(null);
  const [isPending, startRequest] = useTransition();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, startCommentRequest] = useTransition();
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (activeCardId && board) {
      let isMounted = true;

      for (const column of board.columns) {
        const foundCard = column.cards.find((c: Card) => c.id === activeCardId);
        if (foundCard) {
          startTransition(() => {
            setTitle(foundCard.title);
            setAssigneeId(foundCard.assigneeId || "unassigned");
            setType(foundCard.type || "FEATURE");
          });
          break;
        }
      }

      // 2. LAZY LOAD: Fetch the heavy data (Description, Attachments, Comments)
      startTransition(() => {
        setIsLoadingDetails(true);
        setComments([]);
      });

      // We call our new unified action!
      getCardDetailsAction(activeCardId).then(
        (res: Awaited<ReturnType<typeof getCardDetailsAction>>) => {
          if (isMounted && res.success && res.data) {
            startTransition(() => {
              // Populate the heavy fields!
              setDescription(res.data.description || "");
              setCard(res.data); // This contains res.data.attachments
              setComments(res.data.comments || []);
              setIsLoadingDetails(false);
            });
          }
        },
      );

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
        assigneeId: assigneeId === "unassigned" ? null : assigneeId, // Pass this so we can notify the assignee of new comment
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

            <FileUploadZone cardId={activeCardId} boardId={board.id} />

            {/* 2. The Attachment Gallery */}
            {card?.attachments && card.attachments.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-semibold text-gray-700">
                  Attachments
                </h3>
                <div className="flex flex-wrap gap-4">
                  {card.attachments.map((file: Attachment) => (
                    <a
                      key={file.id}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex h-20 w-24 flex-col items-center justify-center overflow-hidden rounded-md border bg-gray-50 transition hover:border-blue-500 hover:shadow-sm"
                    >
                      {/* If it's an image, render the Next.js optimized picture */}
                      {file.fileType.startsWith("image/") ? (
                        <Image
                          src={file.fileUrl}
                          alt={file.fileName} // Fixed: Axe-Linter Error
                          fill
                          className="object-cover transition group-hover:opacity-80"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2 text-center">
                          <svg
                            className="mb-1 h-6 w-6 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="w-full truncate px-1 text-[10px] text-gray-500">
                            {file.fileName}
                          </span>
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

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

            {isLoadingDetails ? (
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
