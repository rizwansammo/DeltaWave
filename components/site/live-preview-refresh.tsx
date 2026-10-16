"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Payload's Live Preview shows this page in an iframe inside the admin and
// posts a message whenever the document is saved. Re-rendering on the server
// keeps the preview honest: it shows exactly what the page will look like,
// through the same access control as a normal request.

export function LivePreviewRefresh({ origin }: { origin: string }) {
  const router = useRouter();
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin) return;
      const data = event.data as { type?: string } | null;
      if (data?.type === "payload-document-event") router.refresh();
    };
    window.addEventListener("message", onMessage);
    // Tells the admin the preview is listening (used by the popup window).
    try {
      window.parent?.postMessage({ type: "payload-live-preview", ready: true }, origin);
    } catch {
      // A cross-origin parent simply does not receive it.
    }
    return () => window.removeEventListener("message", onMessage);
  }, [origin, router]);
  return null;
}
