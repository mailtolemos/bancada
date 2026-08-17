import Link from "next/link";

export function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
      {href && linkLabel && (
        <Link
          href={href}
          className="text-sm font-semibold text-pitch-600 hover:underline dark:text-pitch-400"
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
