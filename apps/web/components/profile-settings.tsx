"use client";

import { useState, useTransition } from "react";
import { User, Settings } from "lucide-react";
import {
  changePasswordAction,
  updateProfileAction,
} from "@/app/actions/user-actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const trimmedName = name.trim();
    const hasNameChanged = trimmedName !== (initialName || "");
    const isChangingPassword = oldPass || newPass || confirmPass;

    // 1. Check if they actually changed anything
    if (!hasNameChanged && !isChangingPassword) {
      return setMessage({ text: "No changes to save.", type: "error" });
    }

    // 2. Validate password fields if they are trying to change it
    if (isChangingPassword) {
      if (!oldPass || !newPass || !confirmPass) {
        return setMessage({
          text: "Please fill in all password fields to change it",
          type: "error",
        });
      }
      if (newPass !== confirmPass) {
        return setMessage({
          text: "New passwords do not match",
          type: "error",
        });
      }
    }

    // 3. Execute updates sequentially inside the transition
    startTransition(async () => {
      try {
        let nameUpdated = false;
        let passUpdated = false;

        // Update Name
        if (hasNameChanged) {
          const nameRes = await updateProfileAction(trimmedName);
          if (!nameRes?.success)
            throw new Error(nameRes?.error || "Failed to update name");
          nameUpdated = true;
        }

        // Update Password
        if (isChangingPassword) {
          const passRes = await changePasswordAction({ oldPass, newPass });
          if (!passRes?.success)
            throw new Error(passRes?.error || "Failed to update password");
          passUpdated = true;
        }

        // Generate dynamic success message
        const updates = [];
        if (nameUpdated) updates.push("profile name");
        if (passUpdated) updates.push("password");

        setMessage({
          text: `Successfully updated ${updates.join(" and ")}! 🔒`,
          type: "success",
        });

        // Clear password fields on success
        if (passUpdated) {
          setOldPass("");
          setNewPass("");
          setConfirmPass("");
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";

        setMessage({
          text: message,
          type: "error",
        });
      }
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
          <DialogDescription>
            Dialog where users can update their display name and change their
            password
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-col gap-6 mt-2">
          {/* SECTION 1: Profile */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1">
              General
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                placeholder="e.g., Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* SECTION 2: Security */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1">
              Security
            </h3>
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <Input
                type="password"
                placeholder="Required to change your password"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
              />
            </div>
          </div>

          {/* STATUS MESSAGE */}
          {message && (
            <div
              className={`rounded-md p-3 text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* SUBMIT */}
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
