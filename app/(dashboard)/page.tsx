import { prisma } from "@/lib/prisma";
import { obterEmpreendimentoAtivo } from "@/lib/empreendimento-ativo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusParcela } from "@prisma/client";
import dynamic from "next/dynamic";
const RecebimentosChart = dynamic(
  () => import("@/components/dashboard/recebimentos-chart").then((m) => ({ default: m.RecebimentosChart })),
  { ssr: false, loading: () => <div className="h-[200px] animate-pulse rounded-lg bg-muted" /> }
);
import { TrendingUp, AlertTriangle, Wallet, Receipt } from "lucide-react";

export const revalidate = 30;

export default async function DashboardPage() {
  const { empreendimentoAtivo } = await obterEmpreendimentoAtivo();

  if (!empreendimentoAtivo) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Crie um empreendimento para começar.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
  const inicio6m = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);

  const [parcelas, ultimaPrestacao, alertas, parcelasGrafico] = await Promise.all([
    prisma.parcela.findMany({
      where: {
        contrato: { lote: { empreendimentoId: empreendimentoAtivo.id } },
        dataVencimento: { gte: inicioMes, lte: fimMes },
      },
      include: { contrato: { include: { lote: true } } },
    }),
    prisma.prestacaoDeContas.findFirst({
      where: { empreendimentoId: empreendimentoAtivo.id },
      orderBy: [{ anoReferencia: "desc" }, { mesReferencia: "desc" }],
      include: { _count: { select: { divergencias: true } } },
    }),
    prisma.alerta.findMany({
      orderBy: { criadoEm: "desc" },
      take: 3,
    }),
    prisma.parcela.findMany({
      where: {
        contrato: { lote: { empreendimentoId: empreendimentoAtivo.id } },
        dataRecebimento: { gte: inicio6m },
        status: { in: ["RECEBIDA", "BAIXA_AUTOMATICA", "BAIXA_MANUAL"] },
      },
    }),
  ]);

  const aReceber = parcelas.reduce((acc, p) => acc + Number(p.valorOriginal), 0);
  const recebido = parcelas
    .filter((p) => ["RECEBIDA", "BAIXA_AUTOMATICA", "BAIXA_MANUAL"].includes(p.status))
    .reduce((acc, p) => acc + Number(p.valorRecebido ?? p.valorOriginal), 0);
  const inadimplente = parcelas
    .filter((p) => p.status === StatusParcela.ATRASADA)
    .reduce((acc, p) => acc + Number(p.valorOriginal), 0);

  const minhaParte = parcelas.reduce((acc, p) => {
    const tipo = p.contrato.lote.tipoPropriedade;
    const valor = Number(p.valorOriginal);
    const percent = tipo === "PESSOAL" ? 1 : empreendimentoAtivo.percentualSocio / 100;
    return acc + valor * percent;
  }, 0);

  const dadosGrafico: { mes: string; valor: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const rotulo = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const soma = parcelasGrafico
      .filter((p) => p.dataRecebimento && p.dataRecebimento >= d && p.dataRecebimento <= fim)
      .reduce((acc, p) => acc + Number(p.valorRecebido ?? p.valorOriginal), 0);
    dadosGrafico.push({ mes: rotulo, valor: soma });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {empreendimentoAtivo.nome} · {empreendimentoAtivo.percentualSocio}% societário
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="A receber no mês"
          value={formatCurrency(aReceber)}
          icon={<Receipt className="h-4 w-4" />}
        />
        <MetricCard
          title="Recebido no mês"
          value={formatCurrency(recebido)}
          icon={<TrendingUp className="h-4 w-4 text-green-600" />}
        />
        <MetricCard
          title="Inadimplente"
          value={formatCurrency(inadimplente)}
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
        />
        <MetricCard
          title="Minha parte"
          value={formatCurrency(minhaParte)}
          icon={<Wallet className="h-4 w-4 text-primary" />}
          description={`${empreendimentoAtivo.percentualSocio}% + lotes 100%`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recebimentos (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <RecebimentosChart data={dadosGrafico} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Última conciliação Quality</CardTitle>
            <CardDescription>
              {ultimaPrestacao
                ? `${String(ultimaPrestacao.mesReferencia).padStart(2, "0")}/${ultimaPrestacao.anoReferencia}`
                : "Nenhuma prestação"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ultimaPrestacao ? (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Importada em:</span>{" "}
                  {formatDate(ultimaPrestacao.dataImportacao)}
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <Badge
                    variant={
                      ultimaPrestacao.statusConciliacao === "CONCILIADO_OK"
                        ? "success"
                        : ultimaPrestacao.statusConciliacao === "CONCILIADO_DIVERGENCIAS"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {ultimaPrestacao.statusConciliacao.replace(/_/g, " ")}
                  </Badge>
                </p>
                <p>
                  <span className="text-muted-foreground">Divergências:</span>{" "}
                  {ultimaPrestacao._count.divergencias}
                </p>
                <p>
                  <span className="text-muted-foreground">Total Quality:</span>{" "}
                  {formatCurrency(ultimaPrestacao.totalRecebidoQuality.toString())}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Importe uma prestação para iniciar.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alertas recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alertas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem alertas recentes.</p>
          ) : (
            alertas.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-md border p-3 text-sm"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="flex-1">
                  <p className="font-medium">{a.titulo}</p>
                  <p className="text-xs text-muted-foreground">{a.mensagem}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatDate(a.criadoEm)}
                  </p>
                </div>
                {!a.lido && <Badge variant="secondary">Novo</Badge>}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-xl font-bold">{value}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
