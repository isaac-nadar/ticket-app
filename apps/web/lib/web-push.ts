import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:admin@reddway.io",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export { webpush };
