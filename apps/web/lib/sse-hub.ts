// Minimal self-hosted pub/sub for Server-Sent Events — replaces Pusher.
// A "channel" is just a string key (e.g. `board-<id>`, `user-<id>`);
// anything can subscribe/broadcast to it without knowing about the others.

type SSEClient = {
  write: (chunk: string) => void;
};

type SSEHub = {
  channels: Map<string, Set<SSEClient>>;
};

// Server Actions and Route Handlers can land in separate module graphs at
// runtime — this is what broke the domain event bus earlier (see
// domain/events/domain-events.ts) — so this registry has to be a true
// globalThis singleton, not just a dev/hot-reload guard like the
// prisma/pusher clients use elsewhere in this codebase. The split is
// structural to how Next.js bundles Server Actions vs. Route Handlers, not
// a dev-only artifact, so the assignment below is unconditional.
const globalForSSE = globalThis as unknown as { sseHub?: SSEHub };

const hub: SSEHub = globalForSSE.sseHub ?? { channels: new Map() };
globalForSSE.sseHub = hub;

// Called once per connection (inside the Route Handler's ReadableStream
// `start`). Returns an unsubscribe function to call on disconnect.
export function subscribe(channel: string, client: SSEClient): () => void {
  if (!hub.channels.has(channel)) {
    hub.channels.set(channel, new Set());
  }
  hub.channels.get(channel)!.add(client);

  return () => {
    const clients = hub.channels.get(channel);
    if (!clients) return;
    clients.delete(client);
    if (clients.size === 0) {
      hub.channels.delete(channel);
    }
  };
}

// Fire-and-forget push to every connection currently on this channel.
export function broadcast(
  channel: string,
  event: string,
  data: unknown,
): void {
  const clients = hub.channels.get(channel);
  if (!clients || clients.size === 0) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch {
      // Dead connection — drop it rather than let one bad client break
      // delivery to everyone else on the channel.
      clients.delete(client);
    }
  }
}

const HEARTBEAT_MS = 25000;

// Shared streaming mechanics for every SSE Route Handler — the only thing
// that differs between routes is which channel they subscribe to and what
// auth check gates it, both of which the caller has already resolved by
// the time this runs.
export function createSSEResponse(channel: string): Response {
  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const client = {
        write: (chunk: string) => controller.enqueue(encoder.encode(chunk)),
      };
      unsubscribe = subscribe(channel, client);

      // Some proxies/browsers wait for the first byte before treating the
      // connection as open.
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Keep idle connections alive through reverse proxies that kill
      // streams after N seconds of no traffic.
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, HEARTBEAT_MS);
    },
    cancel() {
      clearInterval(heartbeat);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx response buffering
    },
  });
}
