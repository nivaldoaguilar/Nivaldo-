import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const empreendimentos = await prisma.empreendimento.findMany({
    where: { arquivado: false },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(empreendimentos);
}

const criarSchema = z.object({
  nome: z.string().min(2),
  percentualSocio: z.number().min(0).max(100).default(0),
  tipoParticipacao: z.enum(["lotes", "societario", "ambos"]).default("societario"),
  descricao: z.string().optional().nullable(),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = criarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const emp = await prisma.empreendimento.create({
    data: {
      nome: parsed.data.nome,
      percentualSocio: parsed.data.percentualSocio,
      tipoParticipacao: parsed.data.tipoParticipacao,
      descricao: parsed.data.descricao ?? null,
      cor: parsed.data.cor ?? "#3b82f6",
    },
  });
  return NextResponse.json(emp, { status: 201 });
}
