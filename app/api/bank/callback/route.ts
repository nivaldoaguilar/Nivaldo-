import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { exchangeCodeForToken } from "@/lib/sicoob";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = cookies().get("sicoob_oauth_state")?.value;

  if (!code || !state || state !== expected) {
    return NextResponse.redirect(new URL("/extrato?erro=oauth_state", url));
  }

  try {
    const token = await exchangeCodeForToken(code);
    const contaId = url.searchParams.get("contaId");
    if (contaId) {
      await prisma.contaBancaria.update({
        where: { id: contaId },
        data: {
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
        },
      });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(new URL("/extrato?erro=oauth_exchange", url));
  }

  return NextResponse.redirect(new URL("/extrato?ok=1", url));
}
