import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatusContrato, StatusParcela, TipoAlerta } from "@prisma/client";
import { emailParcelaVencida } from "@/lib/email";
import { diasEntre, formatCurrency } from "@/lib/utils";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await prisma.configuracao.findFirst();
  const dias = config?.diasToleranciaAtraso ?? 5;
  const hoje = new Date();

  const parcelasVencidas = await prisma.parcela.findMany({
    where: {
      dataVencimento: { lt: hoje },
      status: StatusParcela.PENDENTE,
    },
    include: { contrato: { include: { lote: true } } },
  });

  let novosAlertas = 0;
  let emailsEnviados = 0;

  for (const parcela of parcelasVencidas) {
    const atraso = diasEntre(hoje, parcela.dataVencimento);

    await prisma.parcela.update({
      where: { id: parcela.id },
      data: { status: StatusParcela.ATRASADA },
    });

    await prisma.contrato.update({
      where: { id: parcela.contratoId },
      data: { status: StatusContrato.INADIMPLENTE },
    });

    if (atraso > dias) {
      await prisma.alerta.create({
        data: {
          tipo: TipoAlerta.PARCELA_VENCIDA,
          titulo: `Parcela vencida há ${atraso} dias`,
          mensagem: `Lote ${parcela.contrato.lote.identificacao} parcela ${parcela.numeroParcela}`,
          parcelaId: parcela.id,
          loteId: parcela.contrato.loteId,
        },
      });
      novosAlertas++;

      if (config?.emailNotificacoes) {
        try {
          await emailParcelaVencida(config.emailNotificacoes, {
            loteIdentificacao: parcela.contrato.lote.identificacao,
            comprador: parcela.contrato.nomeComprador,
            numeroParcela: parcela.numeroParcela,
            diasAtraso: atraso,
            valor: formatCurrency(parcela.valorOriginal.toString()),
          });
          emailsEnviados++;
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  return NextResponse.json({
    parcelasVencidasProcessadas: parcelasVencidas.length,
    novosAlertas,
    emailsEnviados,
  });
}
