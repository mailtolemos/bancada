import { NextRequest, NextResponse } from "next/server";
import { auth, authDiagnostics, authEnabled } from "@/auth";
import { getProfile, saveProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

/** Perfil do utilizador com sessão iniciada (favoritos sincronizados). */
export async function GET() {
  if (!authEnabled) {
    return NextResponse.json({
      signedIn: false,
      authEnabled: false,
      diagnostics: authDiagnostics(),
    });
  }
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId)
      return NextResponse.json({ signedIn: false, authEnabled: true, diagnostics: authDiagnostics() });
    return NextResponse.json({
      signedIn: true,
      authEnabled: true,
      user: { name: session.user?.name, email: session.user?.email, image: session.user?.image },
      profile: await getProfile(userId),
    });
  } catch {
    // Nunca deixar a UI partir por causa do login.
    return NextResponse.json({ signedIn: false, authEnabled: false, error: "auth" });
  }
}

/** Guarda/funde preferências (clube favorito, clubes seguidos, competições). */
export async function PUT(req: NextRequest) {
  if (!authEnabled) return NextResponse.json({ error: "auth desativado" }, { status: 503 });
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "sem sessão" }, { status: 401 });

    const body = (await req.json()) as {
      club?: string | null;
      clubs?: string[];
      leagues?: string[];
      merge?: boolean;
    };

    const current = await getProfile(userId);
    const profile = await saveProfile(userId, {
      club: body.club !== undefined ? body.club : undefined,
      clubs: body.merge ? [...current.clubs, ...(body.clubs ?? [])] : body.clubs,
      leagues: body.merge ? [...current.leagues, ...(body.leagues ?? [])] : body.leagues,
    });
    return NextResponse.json({ ok: true, profile });
  } catch {
    return NextResponse.json({ error: "falha ao guardar" }, { status: 500 });
  }
}
