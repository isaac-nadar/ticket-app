"use client";

import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth-actions";

export function LogoutButton() {

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full size-10 shadow-sm bg-background border-ui"
        onClick={logoutAction}
      >
        <LogOutIcon className="size-4" />
        <span className="sr-only">Log Out</span>
      </Button>

    </>
  );
}
