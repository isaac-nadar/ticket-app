"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { inviteUserAction } from "./actions";

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

export function InviteButton({ boardId }: { boardId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    startTransition(async () => {
      const res = await inviteUserAction(boardId, email);

      if (res.success) {
        setSuccess("User successfully added to the board!");
        setEmail(""); // Clear the input

        // Auto-close after 2 seconds
        setTimeout(() => setIsOpen(false), 2000);
      } else {
        setError(res.error || "Failed to invite user.");
      }
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setError("");
          setSuccess("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="shadow-sm border-ui bg-background">
          <UserPlus className="size-4 mr-2" />
          Share Board
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-ui border-border shadow-ui rounded-ui">
        <DialogHeader>
          <DialogTitle>Invite to Board</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleInvite} className="flex flex-col gap-5 mt-4">
          {error && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-primary/10 text-primary border border-primary/20 p-3 rounded-md text-sm text-center font-medium">
              {success}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">User Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-end mt-2">
            <Button type="submit" disabled={isPending || !email.trim()}>
              {isPending ? "Inviting..." : "Send Invite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
