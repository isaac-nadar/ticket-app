"use client";

import { useState, useEffect, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";
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
import type { Notification as AppNotification } from "@/domain/notification/notification.type";
import { pusherClient } from "@/lib/pusher-client";

export function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[] | []>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Read inside the Pusher callback below instead of putting `isOpen` in
  // that effect's deps — otherwise every popover open/close would tear
  // down and recreate the channel subscription, with a real chance of
  // missing a live event in the gap.
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

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
    channel.bind(
      "notification",
      (data: {
        count: number;
        title: string;
        body: string;
        cardId?: string;
        boardId?: string;
      }) => {
        setUnreadCount(data.count);
        if (isOpenRef.current) {
          loadNotifications();
        }

        // Instant desktop popup for this real-time event — only while the
        // tab isn't focused, since the badge above already covers "looking
        // at it right now". This is on top of the true Web Push path
        // (PushNotificationToggle), which also fires when no tab is open.
        if (
          typeof Notification !== "undefined" &&
          Notification.permission === "granted" &&
          document.hidden
        ) {
          const desktopNotification = new Notification(data.title, {
            body: data.body,
          });
          desktopNotification.onclick = () => {
            window.focus();
            if (data.cardId && data.boardId) {
              router.push(`/boards/${data.boardId}?card=${data.cardId}`);
            }
            desktopNotification.close();
          };
        }
      },
    );

    return () => {
      if (pusherClient) {
        pusherClient.unsubscribe(channelName);
        channel.unbind_all();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadNotifications = async () => {
    startTransition(() => {
      setIsLoading(true);
    });
    try {
          const res = await getNotificationsAction();
          if (res.success && "data" in res && res.data) {
              setNotifications(res.data.data as AppNotification[]);
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

  // 3b. Open the card a notification is about, marking it read on the way.
  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    if (notif.cardId && notif.boardId) {
      setIsOpen(false);
      router.push(`/boards/${notif.boardId}?card=${notif.cardId}`);
    }
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
            notifications.map((notif: AppNotification) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`flex gap-3 p-4 border-b border-border/50 transition-colors ${
                  notif.cardId && notif.boardId ? "cursor-pointer hover:bg-muted/40" : ""
                } ${notif.read ? "bg-background opacity-70" : "bg-primary/5"}`}
              >
                <div className="mt-0.5">
                  <CheckCircle2
                    className={`size-4 ${notif.read ? "text-muted-foreground" : "text-primary"}`}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <p className="text-sm font-medium">{notif.title}</p>
                  {notif.body && (
                    <p className="text-sm text-muted-foreground">{notif.body}</p>
                  )}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notif.id);
                    }}
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
