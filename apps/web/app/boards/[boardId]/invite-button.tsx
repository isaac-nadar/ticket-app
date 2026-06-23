"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, UserPlus } from "lucide-react";
import { getAvailableUsersAction, assignUserToBoardAction } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/domain/user/user.types";

export function InviteButton({
  boardId,
  isAdmin,
}: {
  boardId: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      getAvailableUsersAction(boardId).then((res) => {
        console.log("Available users:", res);
        if (res?.success && res.data) setAvailableUsers(res.data);
      });
    }
  }, [open, boardId]);

  const handleAssign = () => {
    if (!selectedUserId) return;

    startTransition(async () => {
      await assignUserToBoardAction({ boardId, userId: selectedUserId });
      setOpen(false);
      setSelectedUserId("");
    });
  };

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed">
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Member</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign to Board</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Assign users to current board. Only users not already assigned to this
          board will be shown.
        </DialogDescription>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Select Employee</span>

            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team member..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">
                    No available employees found.
                  </div>
                ) : (
                  availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleAssign}
            disabled={isPending || !selectedUserId}
          >
            {isPending ? "Assigning..." : "Assign to Board"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
