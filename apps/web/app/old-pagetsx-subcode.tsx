"use client";
import { getServerSession } from "next-auth";

export default function Home() {


  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  async function subscribeToPush() {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service workers not supported");
    }

    // 1️⃣ Register service worker
    await navigator.serviceWorker.register("/sw.js");

    // 2️⃣ WAIT until it is active
    const registration = await navigator.serviceWorker.ready;

    // 3️⃣ Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string),
    });
    // 4️⃣ Send to backend
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
  }

  async function unsubscribeFromPush() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();

    if (!sub) return;

    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });

    await sub.unsubscribe();
  }


  return (
    <main style={{ padding: 40 }}>
      <div>hello12</div>
      <div>
        <button type="button" onClick={() => subscribeToPush()}>enable push</button>
      </div>
      {/* <div>
        <button type="button" onClick={() => unsubscribeFromPush()}>disable push</button>
      </div> */}
    </main>
  );
}
