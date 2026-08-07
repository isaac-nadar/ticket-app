"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  subscribeToPushAction,
  unsubscribeFromPushAction,
} from "@/app/actions/push-actions";

// Web Push application server keys are base64url — PushManager wants a
// raw Uint8Array.
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);

    if (!supported) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub))
      .catch(() => setIsSupported(false));
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
        ),
      });

      const json = subscription.toJSON();
      const res = await subscribeToPushAction({
        endpoint: json.endpoint as string,
        // p256dh/auth are always present once subscribed successfully.
        keys: json.keys as { p256dh: string; auth: string },
      });

      if (res.success) setIsSubscribed(true);
    } catch (err) {
      console.error("[CLIENT] Failed to subscribe to push:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await unsubscribeFromPushAction({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (err) {
      console.error("[CLIENT] Failed to unsubscribe from push:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full size-10 shadow-sm bg-background border-ui"
      disabled={isLoading}
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      title={
        isSubscribed
          ? "Disable desktop/phone notifications"
          : "Enable desktop/phone notifications"
      }
    >
      {isSubscribed ? (
        <BellRing className="size-5 text-primary" />
      ) : (
        <BellOff className="size-5 text-muted-foreground" />
      )}
      <span className="sr-only">
        {isSubscribed ? "Disable system notifications" : "Enable system notifications"}
      </span>
    </Button>
  );
}
