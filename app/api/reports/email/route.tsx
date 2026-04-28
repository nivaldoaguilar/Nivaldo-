import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RelatorioConciliacaoPDF } from "@/lib/pdf-relatorio";
import { emailRelatorioDivergencias } from "@/lib/email";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const prestacaoId: string = body.prestacaoId;

  const prestacao = await prisma.prestacaoDeContas.findUnique({
    where: { id: prestacaoId },
    include: { empreendimento: true, itens: true, divergencias: true },
  });
  if (!prestacao) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

  const config = await prisma.configuracao.findFirst();
  if (!config?.emailNotificacoes) {
    return NextResponse.json({ error: "E-mail de notificações não configurado" }, { status: 400 });
  }

  const pdfBuffer = await renderToBuffer(<RelatorioConciliacaoPDF prestacao={prestacao} />);

  await emailRelatorioDivergencias(config.emailNotificacoes, {
    mesReferencia: `${String(prestacao.mesReferencia).padStart(2, "0")}/${prestacao.anoReferencia}`,
    empreendimento: prestacao.empreendimento.nome,
    totalDivergencias: prestacao.divergencias.length,
    criticas: prestacao.divergencias.filter((d) => d.severidade === "CRITICO").length,
    pdfBuffer: pdfBuffer as Buffer,
  });

  return NextResponse.json({ ok: true });
}
