import type { Dictionary, Locale, NewsItem } from "@bancada/core";
import { timeAgo } from "@/lib/format";
import { NewsImage } from "./NewsImage";

export function NewsCard({
  item,
  locale,
  dict,
  featured = false,
}: {
  item: NewsItem;
  locale: Locale;
  dict: Dictionary;
  /** cartão grande com imagem em cima (primeira notícia de uma lista) */
  featured?: boolean;
}) {
  const external = item.link !== "#";
  const Wrapper = external ? "a" : "div";

  if (featured && item.image) {
    return (
      <Wrapper
        {...(external ? { href: item.link, target: "_blank", rel: "noopener noreferrer" } : {})}
        className="card group relative block overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-card-hover"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt=""
          className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] sm:h-56"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="chip bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-sm">{item.source}</span>
            <span className="font-medium text-white/70">{timeAgo(item.publishedAt, locale)}</span>
          </div>
          <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-white sm:text-lg">
            {item.title}
          </h3>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      {...(external ? { href: item.link, target: "_blank", rel: "noopener noreferrer" } : {})}
      className="card group flex gap-3 overflow-hidden p-3 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      {item.image && <NewsImage src={item.image} />}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span
            className={`chip ${
              item.kind === "rumor"
                ? "bg-orange-500/10 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
                : item.kind === "social"
                  ? "bg-violet-500/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                  : "bg-pitch-600/10 text-pitch-700 dark:bg-pitch-500/15 dark:text-pitch-300"
            }`}
          >
            {item.source}
          </span>
          <span className="text-neutral-500">{timeAgo(item.publishedAt, locale)}</span>
          {item.clubs.slice(0, 2).map((slug) => (
            <span
              key={slug}
              className="chip bg-neutral-200/80 capitalize text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
            >
              {slug.replace(/-/g, " ")}
            </span>
          ))}
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:underline">
          {item.title}
        </h3>
        {item.snippet && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            {item.snippet}
          </p>
        )}
      </div>
    </Wrapper>
  );
}
