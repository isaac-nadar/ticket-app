"use client";

import { useState, useTransition } from "react";
import { User, Settings } from "lucide-react";
import { updateProfileAction } from "@/app/actions/user-actions";

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

export function ProfileSettings({
  initialName,
}: {
  initialName?: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(initialName || "");
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      await updateProfileAction(name);
      setIsOpen(false);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full size-10 shadow-sm bg-background border-ui"
        >
          <User className="size-5 text-foreground" />
          <span className="sr-only">Profile Settings</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm bg-card text-card-foreground border-ui border-border shadow-ui rounded-ui">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Profile Settings
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-col gap-5 mt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              placeholder="e.g., Ada Lovelace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-end mt-2">
            <Button
              type="submit"
              disabled={isPending || !name.trim()}
              className="w-full"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
