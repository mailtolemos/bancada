import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["pt", "en", "es", "fr"];
const DEFAULT_LOCALE = "pt";

function pickLocale(req: NextRequest): string {
  const header = req.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const code = part.split(";")[0]!.trim().slice(0, 2).toLowerCase();
    if (LOCALES.includes(code)) return code;
  }
  return DEFAULT_LOCALE;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return NextResponse.next();

  const locale = pickLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Tudo exceto API, assets internos e ficheiros estáticos
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
