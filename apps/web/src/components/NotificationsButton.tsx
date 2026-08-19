"use client";

/**
 * Notificações de golos por clube (Web Push).
 * No iPhone (iOS 16.4+) só funciona com o site instalado no ecrã principal —
 * quando detetamos Safari iOS fora de standalone, mostramos a instrução.
 */
import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";

type State = "idle" | "unsupported" | "ios-needs-install" | "denied" | "on" | "busy";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function NotificationsButton({
  club,
  labels,
}: {
  club: string;
  labels: { enable: string; enabled: string; iosHint: string; denied: string };
}) {
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState(isIos && !standalone ? "ios-needs-install" : "unsupported");
      return;
    }
    if (isIos && !standalone) {
      setState("ios-needs-install");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    // Já subscrito a este clube?
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      const saved = localStorage.getItem(`bancada:push:${club}`);
      setState(sub && saved ? "on" : "idle");
    });
  }, [club]);

  async function toggle() {
    if (state === "busy") return;
    try {
      setState("busy");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const existing = await reg.pushManager.getSubscription();

      if (localStorage.getItem(`bancada:push:${club}`) && existing) {
        // desligar este clube
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unsubscribe", endpoint: existing.endpoint, clubs: [club] }),
        });
        localStorage.removeItem(`bancada:push:${club}`);
        setState("idle");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }
      const keyRes = await fetch("/api/push/key");
      if (!keyRes.ok) throw new Error("push não configurado");
      const { key } = (await keyRes.json()) as { key: string };
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        }));
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), clubs: [club] }),
      });
      if (!res.ok) throw new Error("falha na subscrição");
      localStorage.setItem(`bancada:push:${club}`, "1");
      setState("on");
    } catch {
      setState("idle");
    }
  }

  if (state === "unsupported") return null;

  if (state === "ios-needs-install") {
    return (
      <span className="chip bg-neutral-200/80 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400" title={labels.iosHint}>
        <Bell size={13} aria-hidden /> {labels.iosHint}
      </span>
    );
  }

  if (state === "denied") {
    return (
      <span className="chip bg-neutral-200/80 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        <Bell size={13} aria-hidden /> {labels.denied}
      </span>
    );
  }

  const on = state === "on";
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={state === "busy"}
      className={`chip transition-colors ${
        on
          ? "bg-pitch-600/15 text-pitch-700 ring-1 ring-pitch-600/40 dark:text-pitch-300"
          : "bg-neutral-200/80 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
      }`}
    >
      {on ? <BellRing size={13} aria-hidden /> : <Bell size={13} aria-hidden />}
      {on ? labels.enabled : labels.enable}
    </button>
  );
}
