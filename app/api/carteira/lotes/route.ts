import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { gerarParcelas } from "@/lib/gerar-parcelas";
import { TipoPropriedade } from "@prisma/client";

const schema = z.object({
  empreendimentoId: z.string().min(1),
  quadra: z.string().min(1),
  numero: z.string().min(1),
  identificacao: z.string().optional(),
  areaM2: z.number().optional(),
  tipoPropriedade: z.enum(["SOCIETARIO", "PESSOAL"]).default("SOCIETARIO"),
  contrato: z
    .object({
      nomeComprador: z.string().min(2),
      cpfComprador: z.string().optional().nullable(),
      telefoneComprador: z.string().optional().nullable(),
      emailComprador: z.string().email().optional().nullable(),
      valorTotal: z.number().positive(),
      valorEntrada: z.number().min(0).default(0),
      dataAssinatura: z.string(),
      dataVencimento1Parcela: z.string(),
      quantidadeParcelas: z.number().int().positive(),
      valorParcela: z.number().positive(),
      diaVencimento: z.number().int().min(1).max(31),
      observacoes: z.string().optional().nullable(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const identificacao = data.identificacao || `Q${data.quadra}-L${data.numero}`;

  const lote = await prisma.lote.create({
    data: {
      empreendimentoId: data.empreendimentoId,
      quadra: data.quadra,
      numero: data.numero,
      identificacao,
      areaM2: data.areaM2,
      tipoPropriedade: data.tipoPropriedade as TipoPropriedade,
    },
  });

  if (data.contrato) {
    const c = data.contrato;
    const contrato = await prisma.contrato.create({
      data: {
        loteId: lote.id,
        nomeComprador: c.nomeComprador,
        cpfComprador: c.cpfComprador ?? null,
        telefoneComprador: c.telefoneComprador ?? null,
        emailComprador: c.emailComprador ?? null,
        valorTotal: c.valorTotal,
        valorEntrada: c.valorEntrada,
        dataAssinatura: new Date(c.dataAssinatura),
        dataVencimento1Parcela: new Date(c.dataVencimento1Parcela),
        quantidadeParcelas: c.quantidadeParcelas,
        valorParcela: c.valorParcela,
        diaVencimento: c.diaVencimento,
        observacoes: c.observacoes ?? null,
      },
    });

    const parcelas = gerarParcelas({
      quantidadeParcelas: c.quantidadeParcelas,
      valorParcela: c.valorParcela,
      dataVencimento1Parcela: new Date(c.dataVencimento1Parcela),
      diaVencimento: c.diaVencimento,
    });

    await prisma.parcela.createMany({
      data: parcelas.map((p) => ({
        contratoId: contrato.id,
        numeroParcela: p.numeroParcela,
        valorOriginal: p.valorOriginal,
        dataVencimento: p.dataVencimento,
        status: p.status,
      })),
    });
  }

  return NextResponse.json(lote, { status: 201 });
}
