import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buscarTransacoesSicoob, identificarRepasseQuality } from "@/lib/sicoob";
import { tentarBaixaAutomatica } from "@/lib/baixa-automatica";
import { CategoriaTransacao, TipoAlerta, TipoTransacao } from "@prisma/client";
import { emailRepasseRecebido } from "@/lib/email";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const contaId: string = body.contaId;
  const from: string = body.from;
  const to: string = body.to;

  const conta = await prisma.contaBancaria.findUnique({ where: { id: contaId } });
  if (!conta) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

  let transacoes: Awaited<ReturnType<typeof buscarTransacoesSicoob>> = [];
  try {
    transacoes = await buscarTransacoesSicoob(contaId, `${conta.agencia}-${conta.conta}`, from, to);
  } catch (e) {
    return NextResponse.json(
      { error: "Falha ao buscar no Sicoob", detalhe: String(e) },
      { status: 502 },
    );
  }

  let novas = 0;
  let repassesNovos = 0;
  let totalRepasses = 0;

  for (const tx of transacoes) {
    const isRepasse = identificarRepasseQuality(tx.description);
    const existente = await prisma.transacao.findUnique({
      where: {
        contaBancariaId_transacaoExternaId: {
          contaBancariaId: contaId,
          transacaoExternaId: tx.transactionId,
        },
      },
    });
    if (existente) continue;

    const criada = await prisma.transacao.create({
      data: {
        contaBancariaId: contaId,
        transacaoExternaId: tx.transactionId,
        data: new Date(tx.date),
        descricao: tx.description,
        valor: tx.amount,
        tipo: tx.type === "CREDIT" ? TipoTransacao.CREDITO : TipoTransacao.DEBITO,
        categoria: isRepasse ? CategoriaTransacao.REPASSE_QUALITY : CategoriaTransacao.OUTROS,
        identificadaComoRepasse: isRepasse,
      },
    });
    novas++;

    if (criada.tipo === TipoTransacao.CREDITO) {
      await tentarBaixaAutomatica(criada.id);
    }

    if (isRepasse) {
      repassesNovos++;
      totalRepasses += Number(criada.valor);
    }
  }

  await prisma.contaBancaria.update({
    where: { id: contaId },
    data: { ultimaSincronizacao: new Date() },
  });

  if (repassesNovos > 0) {
    const config = await prisma.configuracao.findFirst();
    await prisma.alerta.create({
      data: {
        tipo: TipoAlerta.REPASSE_RECEBIDO,
        titulo: "Repasse Quality recebido",
        mensagem: `${repassesNovos} crédito(s) Quality totalizando ${totalRepasses.toFixed(2)} em ${conta.apelido}`,
      },
    });
    if (config?.emailNotificacoes) {
      await emailRepasseRecebido(config.emailNotificacoes, {
        conta: conta.apelido,
        valor: totalRepasses.toFixed(2),
        data: new Date().toLocaleDateString("pt-BR"),
      }).catch(() => undefined);
    }
  }

  return NextResponse.json({ novas, repassesNovos });
}
