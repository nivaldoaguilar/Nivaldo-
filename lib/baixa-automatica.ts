import { prisma } from "@/lib/prisma";
import { StatusParcela, StatusContrato } from "@prisma/client";

export async function tentarBaixaAutomatica(transacaoId: string) {
  const transacao = await prisma.transacao.findUnique({
    where: { id: transacaoId },
    include: { contaBancaria: true },
  });
  if (!transacao || !transacao.contaBancaria.empreendimentoId) return;

  const empreendimentoId = transacao.contaBancaria.empreendimentoId;
  const valorTx = Number(transacao.valor);

  const parcelas = await prisma.parcela.findMany({
    where: {
      status: { in: [StatusParcela.PENDENTE, StatusParcela.ATRASADA] },
      contrato: { lote: { empreendimentoId } },
    },
    orderBy: { dataVencimento: "asc" },
    include: { contrato: true },
  });

  const match = parcelas.find((p) => Math.abs(Number(p.valorOriginal) - valorTx) < 0.5);
  if (!match) return;

  await prisma.parcela.update({
    where: { id: match.id },
    data: {
      status: StatusParcela.BAIXA_AUTOMATICA,
      dataRecebimento: transacao.data,
      valorRecebido: valorTx,
      transacaoId: transacao.id,
    },
  });

  // Atualiza status do contrato se todas as parcelas vencidas foram pagas
  const parcelasAtrasadas = await prisma.parcela.count({
    where: {
      contratoId: match.contratoId,
      status: StatusParcela.ATRASADA,
    },
  });
  if (parcelasAtrasadas === 0) {
    await prisma.contrato.update({
      where: { id: match.contratoId },
      data: { status: StatusContrato.EM_DIA },
    });
  }
}
