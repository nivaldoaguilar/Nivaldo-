import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const schema = z.object({
  emailNotificacoes: z.string().email(),
  diasToleranciaAtraso: z.number().int().min(0).max(30),
  sicoobClientId: z.string().optional().nullable(),
  sicoobClientSecret: z.string().optional().nullable(),
  sicoobRedirectUri: z.string().optional().nullable(),
});

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const atual = await prisma.configuracao.findFirst();

  const data: Record<string, unknown> = {
    emailNotificacoes: parsed.data.emailNotificacoes,
    diasToleranciaAtraso: parsed.data.diasToleranciaAtraso,
    sicoobClientId: parsed.data.sicoobClientId ?? null,
    sicoobRedirectUri: parsed.data.sicoobRedirectUri ?? null,
  };
  if (parsed.data.sicoobClientSecret) {
    data.sicoobClientSecret = parsed.data.sicoobClientSecret;
  }

  if (atual) {
    const config = await prisma.configuracao.update({ where: { id: atual.id }, data });
    return NextResponse.json(config);
  }
  const config = await prisma.configuracao.create({ data: data as never });
  return NextResponse.json(config);
}
