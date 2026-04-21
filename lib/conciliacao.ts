import { prisma } from "@/lib/prisma";
import {
  CategoriaTransacao,
  Severidade,
  StatusConciliacao,
  StatusParcela,
  TipoDivergencia,
  TipoTransacao,
  TipoAlerta,
} from "@prisma/client";

export type ResultadoConciliacao = {
  prestacaoId: string;
  status: StatusConciliacao;
  totalDivergencias: number;
  divergenciasCriticas: number;
};

const TOLERANCIA_CENTAVOS = 1.0;

export async function executarConciliacao(prestacaoId: string): Promise<ResultadoConciliacao> {
  const prestacao = await prisma.prestacaoDeContas.findUnique({
    where: { id: prestacaoId },
    include: { itens: true, empreendimento: true },
  });

  if (!prestacao) throw new Error("Prestação não encontrada");

  // Limpa divergências anteriores
  await prisma.divergencia.deleteMany({ where: { prestacaoDeContasId: prestacaoId } });

  const inicioMes = new Date(prestacao.anoReferencia, prestacao.mesReferencia - 1, 1);
  const fimMes = new Date(prestacao.anoReferencia, prestacao.mesReferencia, 0, 23, 59, 59);

  // Contas do empreendimento
  const contas = await prisma.contaBancaria.findMany({
    where: { empreendimentoId: prestacao.empreendimentoId, ativa: true },
  });
  const contasIds = contas.map((c) => c.id);

  // 1. VERIFICAÇÃO DE VALORES
  const creditosQuality = await prisma.transacao.findMany({
    where: {
      contaBancariaId: { in: contasIds },
      data: { gte: inicioMes, lte: fimMes },
      tipo: TipoTransacao.CREDITO,
      categoria: CategoriaTransacao.REPASSE_QUALITY,
    },
  });

  const totalExtrato = creditosQuality.reduce((acc, t) => acc + Number(t.valor), 0);
  const totalQuality = Number(prestacao.totalRecebidoQuality);
  const diferenca = Math.abs(totalExtrato - totalQuality);

  if (diferenca > TOLERANCIA_CENTAVOS) {
    await prisma.divergencia.create({
      data: {
        prestacaoDeContasId: prestacaoId,
        tipo: TipoDivergencia.VALOR_DIFERENTE,
        severidade: Severidade.CRITICO,
        descricao: `Total reportado pela Quality (${totalQuality.toFixed(
          2,
        )}) diverge do total de créditos no extrato (${totalExtrato.toFixed(2)}). Diferença: ${diferenca.toFixed(2)}`,
        valorEsperado: totalQuality,
        valorEncontrado: totalExtrato,
      },
    });
  }

  // 2. VERIFICAÇÃO DE INADIMPLÊNCIA (cruzar item a item)
  for (const item of prestacao.itens) {
    const contrato = await prisma.contrato.findFirst({
      where: {
        lote: {
          empreendimentoId: prestacao.empreendimentoId,
          identificacao: item.loteIdentificacao,
        },
      },
      include: { parcelas: true },
    });

    if (!contrato) {
      await prisma.divergencia.create({
        data: {
          prestacaoDeContasId: prestacaoId,
          tipo: TipoDivergencia.PARCELA_NAO_ENCONTRADA,
          severidade: Severidade.ATENCAO,
          descricao: `Item da Quality refere-se ao lote ${item.loteIdentificacao}, mas não há contrato correspondente no sistema`,
          loteIdentificacao: item.loteIdentificacao,
          valorEncontrado: Number(item.valorRecebido),
        },
      });
      continue;
    }

    const parcelasMes = contrato.parcelas.filter(
      (p) => p.dataVencimento >= inicioMes && p.dataVencimento <= fimMes,
    );

    const statusLower = (item.statusReportado ?? "").toLowerCase();
    const qualityReportaInadimplente =
      statusLower.includes("inadimplente") ||
      statusLower.includes("atraso") ||
      statusLower.includes("atrasad");
    const qualityReportaPago = statusLower.includes("pago") || statusLower.includes("recebid");

    const temRecebida = parcelasMes.some(
      (p) =>
        p.status === StatusParcela.RECEBIDA ||
        p.status === StatusParcela.BAIXA_AUTOMATICA ||
        p.status === StatusParcela.BAIXA_MANUAL,
    );
    const temPendenteOuAtrasada = parcelasMes.some(
      (p) => p.status === StatusParcela.PENDENTE || p.status === StatusParcela.ATRASADA,
    );

    if (qualityReportaInadimplente && temRecebida) {
      await prisma.divergencia.create({
        data: {
          prestacaoDeContasId: prestacaoId,
          tipo: TipoDivergencia.INADIMPLENCIA_DIVERGENTE,
          severidade: Severidade.CRITICO,
          descricao: `Quality reportou ${item.loteIdentificacao} como inadimplente, mas há parcela recebida no sistema`,
          loteIdentificacao: item.loteIdentificacao,
        },
      });
    }

    if (qualityReportaPago && temPendenteOuAtrasada && !temRecebida) {
      await prisma.divergencia.create({
        data: {
          prestacaoDeContasId: prestacaoId,
          tipo: TipoDivergencia.INADIMPLENCIA_DIVERGENTE,
          severidade: Severidade.CRITICO,
          descricao: `Quality reportou ${item.loteIdentificacao} como pago, mas o sistema tem parcela pendente/atrasada`,
          loteIdentificacao: item.loteIdentificacao,
          valorEsperado: Number(item.valorRecebido),
        },
      });
    }

    // Vincular ItemPrestacao -> Parcela (melhor esforço)
    if (item.numeroParcela) {
      const parcela = contrato.parcelas.find((p) => p.numeroParcela === item.numeroParcela);
      if (parcela) {
        await prisma.itemPrestacao.update({
          where: { id: item.id },
          data: { parcelaId: parcela.id },
        });
      }
    }
  }

  // 3. VERIFICAÇÃO DE COBERTURA
  const contratosAtivos = await prisma.contrato.findMany({
    where: {
      lote: { empreendimentoId: prestacao.empreendimentoId },
      status: { in: ["EM_DIA", "INADIMPLENTE"] },
    },
    include: { lote: true },
  });

  const identificacoesPrestacao = new Set(prestacao.itens.map((i) => i.loteIdentificacao));
  for (const contrato of contratosAtivos) {
    if (!identificacoesPrestacao.has(contrato.lote.identificacao)) {
      await prisma.divergencia.create({
        data: {
          prestacaoDeContasId: prestacaoId,
          tipo: TipoDivergencia.LOTE_AUSENTE,
          severidade: Severidade.ATENCAO,
          descricao: `Lote ${contrato.lote.identificacao} está ativo no sistema mas não aparece na prestação`,
          loteIdentificacao: contrato.lote.identificacao,
        },
      });
    }
  }

  // 4. CRÉDITOS SEM ORIGEM
  const creditosNaoVinculados = creditosQuality.filter((t) => !t.prestacaoDeContasId);
  for (const cred of creditosNaoVinculados) {
    await prisma.divergencia.create({
      data: {
        prestacaoDeContasId: prestacaoId,
        tipo: TipoDivergencia.CREDITO_SEM_ORIGEM,
        severidade: Severidade.ATENCAO,
        descricao: `Crédito de ${Number(cred.valor).toFixed(2)} em ${cred.data.toLocaleDateString(
          "pt-BR",
        )} não foi vinculado a nenhum item da prestação`,
        valorEncontrado: Number(cred.valor),
      },
    });
  }

  // Vincular transações do extrato à prestação
  await prisma.transacao.updateMany({
    where: { id: { in: creditosQuality.map((c) => c.id) } },
    data: { prestacaoDeContasId: prestacaoId },
  });

  // Atualizar status
  const divergencias = await prisma.divergencia.findMany({
    where: { prestacaoDeContasId: prestacaoId },
  });
  const criticas = divergencias.filter((d) => d.severidade === Severidade.CRITICO);
  const statusFinal =
    divergencias.length === 0
      ? StatusConciliacao.CONCILIADO_OK
      : StatusConciliacao.CONCILIADO_DIVERGENCIAS;

  await prisma.prestacaoDeContas.update({
    where: { id: prestacaoId },
    data: {
      statusConciliacao: statusFinal,
      totalRecebidoExtrato: totalExtrato,
    },
  });

  // Alertas para divergências críticas
  for (const div of criticas) {
    await prisma.alerta.create({
      data: {
        tipo: TipoAlerta.DIVERGENCIA_CONCILIACAO,
        titulo: "Divergência crítica na conciliação",
        mensagem: div.descricao,
      },
    });
  }

  return {
    prestacaoId,
    status: statusFinal,
    totalDivergencias: divergencias.length,
    divergenciasCriticas: criticas.length,
  };
}
