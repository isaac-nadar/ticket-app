import Pusher from "pusher";

// We use globalThis to prevent Next.js hot-reloads from creating 100 pusher instances in development
const globalForPusher = globalThis as unknown as { pusher: Pusher };

export const pusherServer =
  globalForPusher.pusher ||
  new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true,
  });

if (process.env.NODE_ENV !== "production")
  globalForPusher.pusher = pusherServer;
