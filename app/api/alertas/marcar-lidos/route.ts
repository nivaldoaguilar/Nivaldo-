import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.alerta.updateMany({
    where: { lido: false },
    data: { lido: true },
  });
  return NextResponse.json({ ok: true });
}
