import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RelatorioConciliacaoPDF } from "@/lib/pdf-relatorio";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const prestacaoId = url.searchParams.get("prestacaoId");
  if (!prestacaoId) return NextResponse.json({ error: "prestacaoId obrigatório" }, { status: 400 });

  const prestacao = await prisma.prestacaoDeContas.findUnique({
    where: { id: prestacaoId },
    include: { empreendimento: true, itens: true, divergencias: true },
  });
  if (!prestacao) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

  const buffer = await renderToBuffer(<RelatorioConciliacaoPDF prestacao={prestacao} />);

  return new NextResponse(new Uint8Array(buffer as Buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="conciliacao-${prestacao.mesReferencia}-${prestacao.anoReferencia}.pdf"`,
    },
  });
}
