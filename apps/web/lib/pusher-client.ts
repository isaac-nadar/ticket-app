import PusherClient from "pusher-js";

export const pusherClient =
  typeof window !== "undefined"
    ? new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        // Every browser we support has native WebSocket — restricting to
        // it skips pusher-js's legacy HTTP-polling/streaming fallback
        // transports, which still register an `unload` listener and trip
        // a Permissions Policy violation in current Chrome.
        enabledTransports: ["ws", "wss"],
      })
    : null;
