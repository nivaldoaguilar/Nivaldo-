import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { getAuthorizeUrl } from "@/lib/sicoob";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const state = randomBytes(16).toString("hex");
  const url = getAuthorizeUrl(state);
  const res = NextResponse.redirect(url);
  res.cookies.set("sicoob_oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600 });
  return res;
}
