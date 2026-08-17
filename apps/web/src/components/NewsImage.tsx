"use client";

import { useState } from "react";

/** Miniatura de notícia que desaparece se a fonte bloquear hotlinking. */
export function NewsImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-20 w-28 shrink-0 rounded-lg bg-neutral-200 object-cover dark:bg-neutral-800"
    />
  );
}
