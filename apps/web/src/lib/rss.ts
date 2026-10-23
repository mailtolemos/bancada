import Parser from "rss-parser";

/** Fetch with the standard URL API; rss-parser only handles the XML. */
export function createFeedParser(options: Parser.ParserOptions<Record<string, unknown>, Record<string, unknown>>) {
  const parser = new Parser(options);
  return {
    async parseURL(address: string) {
      const url = new URL(address);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("Unsupported feed protocol");
      }
      const response = await fetch(url, {
        headers: options.headers,
        signal: AbortSignal.timeout(options.timeout ?? 4500),
        cache: "no-store",
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`Feed HTTP ${response.status}`);
      }
      // Bound untrusted feed bodies before parsing them in memory.
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Empty feed response");
      const chunks: Uint8Array[] = [];
      let bytes = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > 5 * 1024 * 1024) throw new Error("Feed exceeds 5 MiB");
          chunks.push(value);
        }
      } finally {
        await reader.cancel();
      }
      return parser.parseString(Buffer.concat(chunks).toString("utf8"));
    },
  };
}
