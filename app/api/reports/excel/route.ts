import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const wb = XLSX.utils.book_new();

  const resumo = [
    ["Empreendimento", prestacao.empreendimento.nome],
    ["Mês/Ano", `${String(prestacao.mesReferencia).padStart(2, "0")}/${prestacao.anoReferencia}`],
    ["Total Quality", Number(prestacao.totalRecebidoQuality)],
    ["Total Extrato", Number(prestacao.totalRecebidoExtrato ?? 0)],
    ["Status", prestacao.statusConciliacao],
    ["Divergências", prestacao.divergencias.length],
    ["Itens", prestacao.itens.length],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), "Resumo");

  const itens = prestacao.itens.map((i) => ({
    Lote: i.loteIdentificacao,
    Comprador: i.nomeComprador ?? "",
    Parcela: i.numeroParcela ?? "",
    Data: i.dataRecebimento.toLocaleDateString("pt-BR"),
    Valor: Number(i.valorRecebido),
    Status: i.statusReportado ?? "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itens), "Itens");

  const divs = prestacao.divergencias.map((d) => ({
    Severidade: d.severidade,
    Tipo: d.tipo,
    Lote: d.loteIdentificacao ?? "",
    Descrição: d.descricao,
    "Valor esperado": d.valorEsperado ? Number(d.valorEsperado) : "",
    "Valor encontrado": d.valorEncontrado ? Number(d.valorEncontrado) : "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(divs), "Divergências");

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" }) as Buffer;

  return new NextResponse(buffer, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="conciliacao-${prestacao.mesReferencia}-${prestacao.anoReferencia}.xlsx"`,
    },
  });
}
