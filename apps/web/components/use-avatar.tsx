"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type MinimalUser = {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
};

export function UserAvatar({
  user,
  className,
}: {
  user: MinimalUser | null | undefined;
  className?: string;
}) {
  // 1. If no user is passed, don't render anything
  if (!user) return null;

  // 2. The Fallback Math: Use their name. If no name, use email.
  // Grab the first two characters and make them uppercase.
  const fallbackString = user.name || user.email || "??";
  const initials = fallbackString.substring(0, 2).toUpperCase();

  return (
    <Avatar className={className}>
      {/* 3. Next.js/Shadcn will try to load this image first */}
      <AvatarImage src={user.avatar || ""} alt={user.name || "User Avatar"} />

      {/* 4. If the src is empty or the image fails to load, this instantly renders! */}
      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold border border-primary/20">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
