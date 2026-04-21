import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const editarSchema = z.object({
  nome: z.string().min(2).optional(),
  percentualSocio: z.number().min(0).max(100).optional(),
  descricao: z.string().optional().nullable(),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  arquivado: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = editarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const emp = await prisma.empreendimento.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json(emp);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.empreendimento.update({
    where: { id: params.id },
    data: { arquivado: true },
  });
  return NextResponse.json({ ok: true });
}
