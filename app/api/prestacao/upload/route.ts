import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsearPlanilhaQuality } from "@/lib/excel-parser";
import { executarConciliacao } from "@/lib/conciliacao";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("arquivo");
  const empreendimentoId = String(form.get("empreendimentoId") ?? "");
  const mes = Number(form.get("mes") ?? 0);
  const ano = Number(form.get("ano") ?? 0);
  const dataEnvioStr = String(form.get("dataEnvio") ?? "");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
  }
  if (!empreendimentoId || !mes || !ano) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parsearPlanilhaQuality(buffer);

  if (parsed.erros.length && parsed.itens.length === 0) {
    return NextResponse.json(
      { error: "Falha ao processar planilha", detalhes: parsed.erros },
      { status: 422 },
    );
  }

  // Upsert prestação
  const prestacao = await prisma.prestacaoDeContas.upsert({
    where: {
      empreendimentoId_mesReferencia_anoReferencia: {
        empreendimentoId,
        mesReferencia: mes,
        anoReferencia: ano,
      },
    },
    update: {
      arquivoNome: file.name,
      totalRecebidoQuality: parsed.total,
      dataEnvio: dataEnvioStr ? new Date(dataEnvioStr) : new Date(),
      dataImportacao: new Date(),
    },
    create: {
      empreendimentoId,
      mesReferencia: mes,
      anoReferencia: ano,
      arquivoNome: file.name,
      totalRecebidoQuality: parsed.total,
      dataEnvio: dataEnvioStr ? new Date(dataEnvioStr) : new Date(),
    },
  });

  await prisma.itemPrestacao.deleteMany({
    where: { prestacaoDeContasId: prestacao.id },
  });

  await prisma.itemPrestacao.createMany({
    data: parsed.itens.map((i) => ({
      prestacaoDeContasId: prestacao.id,
      loteIdentificacao: i.loteIdentificacao,
      nomeComprador: i.nomeComprador,
      valorRecebido: i.valorRecebido,
      dataRecebimento: i.dataRecebimento,
      numeroParcela: i.numeroParcela,
      statusReportado: i.statusReportado,
    })),
  });

  const resultado = await executarConciliacao(prestacao.id);

  return NextResponse.json({
    prestacaoId: prestacao.id,
    itensImportados: parsed.itens.length,
    total: parsed.total,
    resultado,
    avisos: parsed.erros,
  });
}
