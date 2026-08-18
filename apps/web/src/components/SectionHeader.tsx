import Link from "next/link";
import type { ReactNode } from "react";

/** Cabeçalho de secção uniforme: ícone + título + link "ver tudo" opcional. */
export function SectionHeader({
  title,
  icon,
  href,
  linkLabel,
}: {
  title: string;
  icon?: ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
        {icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pitch-600/10 text-pitch-700 dark:bg-pitch-500/15 dark:text-pitch-300">
            {icon}
          </span>
        )}
        {title}
      </h2>
      {href && linkLabel && (
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-pitch-600 hover:underline dark:text-pitch-400"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

export function DemoBanner({ text }: { text: string }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
      <span aria-hidden>⚡</span>
      <span>{text}</span>
    </div>
  );
}

/** Skeleton uniforme para secções em carregamento (streaming). */
export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-2.5" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card animate-pulse px-4 py-4">
          <div className="mb-2 h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      ))}
    </div>
  );
}
