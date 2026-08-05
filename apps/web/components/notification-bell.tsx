"use client";

import { useState, useEffect, startTransition } from "react";
import { Bell, Check, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// 👇 Import your new Server Actions!
import {
  getUnreadCountAction,
  getNotificationsAction,
  markAsReadAction,
  markAllAsReadAction,
} from "@/app/actions/notification-actions";
import { Notification } from "@/domain/notification/notification.type";
import { pusherClient } from "@/lib/pusher-client";

export function NotificationBell({ userId }: { userId: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[] | []>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 1. EAGER LOAD: Fetch unread count using Server Action
  useEffect(() => {
    getUnreadCountAction().then((res) => {
      if (res.success && "data" in res) {
        setUnreadCount(res.data as number);
      }
    });
  }, []);

  // 1b. REAL-TIME: Push the unread count (and refresh the list, if open) the
  // moment a notification is created for this user — no manual refresh needed.
  useEffect(() => {
    if (!pusherClient || !userId) return;

    const channelName = `user-${userId}`;
    const channel = pusherClient.subscribe(channelName);
    channel.bind("notification", (data: { count: number }) => {
      setUnreadCount(data.count);
      if (isOpen) {
        loadNotifications();
      }
    });

    return () => {
      if (pusherClient) {
        pusherClient.unsubscribe(channelName);
        channel.unbind_all();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isOpen]);

  const loadNotifications = async () => {
    startTransition(() => {
      setIsLoading(true);
    });
    try {
          const res = await getNotificationsAction();
          if (res.success && "data" in res && res.data) {
              setNotifications(res.data.data as Notification[]);
          }
      } finally {
          return setIsLoading(false);
      }
  };

  // 2. LAZY LOAD: Fetch the actual rows only when the Popover opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 3. Mark as read using Server Action
  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Fire the background action
    await markAsReadAction({ id });
  };

  // 4. Mark all as read
  const handleMarkAllAsRead = async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    // Fire the background action
    await markAllAsReadAction();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-full size-10 shadow-sm bg-background border-ui"
        >
          <Bell className="size-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center size-4 text-[10px] font-bold leading-none text-primary-foreground bg-primary rounded-full transform translate-x-1/4 -translate-y-1/4 shadow-sm border border-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-0 shadow-ui border-ui border-border rounded-ui"
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {unreadCount} unread
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            </div>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto flex flex-col">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              You&apos;re all caught up!
            </div>
          ) : (
            notifications.map((notif: Notification) => (
              <div
                key={notif.id}
                className={`flex gap-3 p-4 border-b border-border/50 transition-colors ${
                  notif.read ? "bg-background opacity-70" : "bg-primary/5"
                }`}
              >
                <div className="mt-0.5">
                  <CheckCircle2
                    className={`size-4 ${notif.read ? "text-muted-foreground" : "text-primary"}`}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <p className="text-sm">{notif.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notif.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {!notif.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 rounded-full hover:bg-primary/10 hover:text-primary"
                    onClick={() => handleMarkAsRead(notif.id)}
                  >
                    <Check className="size-3" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
