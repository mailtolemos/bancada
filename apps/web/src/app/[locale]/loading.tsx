/** Skeleton global: navegação instantânea enquanto os dados chegam. */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy>
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-6 w-24 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
        ))}
      </div>
      <div className="h-6 w-44 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="grid gap-2.5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card animate-pulse px-4 py-3">
            <div className="mb-2 h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        ))}
      </div>
      <div className="h-6 w-44 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="grid gap-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card animate-pulse px-4 py-4">
            <div className="mb-2 h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
