"use client";

/**
 * Entrar / conta. Sem sessão mostra "Entrar"; com sessão mostra o avatar e
 * um menu simples. Ao entrar, os favoritos locais são enviados para o
 * servidor (fusão), passando a sincronizar entre dispositivos.
 */
import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";

interface MeResponse {
  signedIn: boolean;
  authEnabled: boolean;
  user?: { name?: string | null; email?: string | null; image?: string | null };
  profile?: { club?: string | null; clubs: string[]; leagues: string[] };
}

const FAV_KEY = "bancada:fav-club";

export function AccountButton({
  labels,
}: {
  labels: { signIn: string; signOut: string; account: string; syncing: string; profile: string };
}) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [open, setOpen] = useState(false);
  const merged = useRef(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data: MeResponse) => setMe(data))
      .catch(() => setMe(null));
  }, []);

  // Ao iniciar sessão, envia o favorito local para o servidor (uma vez).
  useEffect(() => {
    if (!me?.signedIn || merged.current) return;
    merged.current = true;
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const local = raw ? (JSON.parse(raw) as { slug?: string }) : null;
      const serverClub = me.profile?.club;

      if (local?.slug && !serverClub) {
        fetch("/api/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ club: local.slug, clubs: [local.slug], merge: true }),
        }).catch(() => {});
      } else if (serverClub && !local?.slug) {
        // Servidor manda: replica no dispositivo para a home reagir já.
        localStorage.setItem(
          FAV_KEY,
          JSON.stringify({ slug: serverClub, teamId: 0, name: serverClub.replace(/-/g, " ") })
        );
        window.dispatchEvent(new Event("bancada:fav-changed"));
      }
    } catch {
      /* armazenamento indisponível */
    }
  }, [me]);

  if (!me?.authEnabled) return null;

  if (!me.signedIn) {
    return (
      <a
        href="/api/auth/signin?callbackUrl=/"
        className="chip bg-neutral-200/80 text-neutral-700 transition-colors hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
      >
        <LogIn size={13} aria-hidden /> {labels.signIn}
      </a>
    );
  }

  const image = me.user?.image;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={labels.account}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-1 ring-neutral-300 transition-shadow hover:ring-pitch-500 dark:ring-neutral-700"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <User size={15} />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
            <p className="truncate text-sm font-semibold">{me.user?.name}</p>
            <p className="truncate text-xs text-neutral-500">{me.user?.email}</p>
          </div>
          <a
            href="/pt/perfil"
            className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <User size={14} aria-hidden /> {labels.profile}
          </a>
          <a
            href="/api/auth/signout?callbackUrl=/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <LogOut size={14} aria-hidden /> {labels.signOut}
          </a>
        </div>
      )}
    </div>
  );
}
