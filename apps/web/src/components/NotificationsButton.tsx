"use client";

/**
 * Notificações de golos por clube (Web Push).
 *
 * Cuidados que importam aqui:
 *  - No iPhone (iOS 16.4+) só funciona com o site instalado no ecrã principal.
 *  - O Safari exige que Notification.requestPermission() seja chamado DENTRO
 *    do gesto do utilizador — por isso é a primeira coisa no clique, antes de
 *    qualquer pedido de rede.
 *  - A chave VAPID e o registo do service worker são pré-carregados no mount
 *    para o clique ficar o mais curto possível.
 *  - Erros nunca são silenciosos: o botão mostra "tentar de novo".
 */
import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, TriangleAlert } from "lucide-react";

type State = "idle" | "unsupported" | "ios-needs-install" | "denied" | "on" | "busy" | "error";

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
  labels: { enable: string; enabled: string; iosHint: string; denied: string; error: string };
}) {
  const [state, setState] = useState<State>("idle");
  const vapidKey = useRef<string | null>(null);

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

    // Pré-carrega tudo o que o clique vai precisar.
    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        const saved = localStorage.getItem(`bancada:push:${club}`);
        setState(sub && saved ? "on" : "idle");
      })
      .catch(() => setState("idle"));
    fetch("/api/push/key")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { key?: string } | null) => {
        if (data?.key) vapidKey.current = data.key;
      })
      .catch(() => {});
  }, [club]);

  async function toggle() {
    if (state === "busy") return;
    const wasOn = state === "on";
    try {
      if (wasOn) {
        // Desligar este clube.
        setState("busy");
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "unsubscribe", endpoint: existing.endpoint, clubs: [club] }),
          });
        }
        localStorage.removeItem(`bancada:push:${club}`);
        setState("idle");
        return;
      }

      // 1) Permissão PRIMEIRO, ainda dentro do gesto (obrigatório no Safari).
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "idle");
        return;
      }
      setState("busy");

      // 2) Service worker ativo.
      const reg = await navigator.serviceWorker.ready;

      // 3) Chave VAPID (normalmente já pré-carregada).
      if (!vapidKey.current) {
        const keyRes = await fetch("/api/push/key");
        if (!keyRes.ok) throw new Error("push não configurado");
        vapidKey.current = ((await keyRes.json()) as { key: string }).key;
      }
      const serverKey = urlBase64ToUint8Array(vapidKey.current);

      // 4) Subscrição — se existir uma antiga com outra chave, refaz do zero.
      let sub: PushSubscription;
      try {
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: serverKey });
      } catch {
        // InvalidStateError: havia uma subscrição com chave diferente.
        const old = await reg.pushManager.getSubscription();
        if (old) await old.unsubscribe().catch(() => {});
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: serverKey });
      }

      // 5) Regista no servidor.
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), clubs: [club] }),
      });
      if (!res.ok) throw new Error(`subscrição falhou (${res.status})`);
      localStorage.setItem(`bancada:push:${club}`, "1");
      setState("on");
    } catch {
      // Nunca falhar em silêncio: o utilizador vê e pode repetir.
      setState("error");
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

  if (state === "error") {
    return (
      <button
        type="button"
        onClick={toggle}
        className="chip bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/40 transition-colors hover:bg-amber-500/25 dark:text-amber-300"
      >
        <TriangleAlert size={13} aria-hidden /> {labels.error}
      </button>
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
      {state === "busy" ? "…" : on ? labels.enabled : labels.enable}
    </button>
  );
}
