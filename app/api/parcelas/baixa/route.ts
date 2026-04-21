import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { StatusParcela, StatusContrato } from "@prisma/client";

const schema = z.object({
  parcelaId: z.string(),
  tipo: z.enum(["manual", "automatica"]).default("manual"),
  transacaoId: z.string().optional(),
  dataRecebimento: z.string().optional(),
  valorRecebido: z.number().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const parcela = await prisma.parcela.findUnique({
    where: { id: parsed.data.parcelaId },
  });
  if (!parcela) return NextResponse.json({ error: "Parcela não encontrada" }, { status: 404 });

  await prisma.parcela.update({
    where: { id: parsed.data.parcelaId },
    data: {
      status:
        parsed.data.tipo === "manual" ? StatusParcela.BAIXA_MANUAL : StatusParcela.BAIXA_AUTOMATICA,
      dataRecebimento: parsed.data.dataRecebimento ? new Date(parsed.data.dataRecebimento) : new Date(),
      valorRecebido: parsed.data.valorRecebido ?? Number(parcela.valorOriginal),
      transacaoId: parsed.data.transacaoId ?? null,
    },
  });

  // Recalcular status do contrato
  const parcelasAtrasadas = await prisma.parcela.count({
    where: {
      contratoId: parcela.contratoId,
      status: StatusParcela.ATRASADA,
    },
  });

  const parcelasPendentes = await prisma.parcela.count({
    where: {
      contratoId: parcela.contratoId,
      status: { in: [StatusParcela.PENDENTE, StatusParcela.ATRASADA] },
    },
  });

  await prisma.contrato.update({
    where: { id: parcela.contratoId },
    data: {
      status:
        parcelasPendentes === 0
          ? StatusContrato.QUITADO
          : parcelasAtrasadas === 0
            ? StatusContrato.EM_DIA
            : StatusContrato.INADIMPLENTE,
    },
  });

  return NextResponse.json({ ok: true });
}
