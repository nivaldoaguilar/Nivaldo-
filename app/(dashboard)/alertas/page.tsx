import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { FiltrosAlertas } from "@/components/alertas/filtros-alertas";
import { MarcarLidosButton } from "@/components/alertas/marcar-lidos-button";
import { TipoAlerta } from "@prisma/client";
import { AlertTriangle, Bell, DollarSign, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

function iconePorTipo(tipo: TipoAlerta) {
  switch (tipo) {
    case TipoAlerta.DIVERGENCIA_CONCILIACAO:
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case TipoAlerta.INADIMPLENCIA_NOVA:
      return <TrendingDown className="h-4 w-4 text-amber-500" />;
    case TipoAlerta.PARCELA_VENCIDA:
      return <Bell className="h-4 w-4 text-amber-500" />;
    case TipoAlerta.REPASSE_RECEBIDO:
      return <DollarSign className="h-4 w-4 text-green-600" />;
  }
}

export default async function AlertasPage({ searchParams }: { searchParams: { tipo?: string } }) {
  const where: { tipo?: TipoAlerta } = {};
  if (
    searchParams.tipo === "DIVERGENCIA_CONCILIACAO" ||
    searchParams.tipo === "INADIMPLENCIA_NOVA" ||
    searchParams.tipo === "PARCELA_VENCIDA" ||
    searchParams.tipo === "REPASSE_RECEBIDO"
  ) {
    where.tipo = searchParams.tipo;
  }

  const alertas = await prisma.alerta.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    take: 200,
  });

  const naoLidos = alertas.filter((a) => !a.lido).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alertas</h1>
          <p className="text-sm text-muted-foreground">{naoLidos} não lido(s)</p>
        </div>
        <MarcarLidosButton />
      </div>

      <FiltrosAlertas />

      <Card>
        <CardHeader>
          <CardTitle>Histórico ({alertas.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alertas.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhum alerta</p>
          ) : (
            alertas.map((a) => (
              <div
                key={a.id}
                className={`flex items-start gap-3 rounded-md border p-3 ${
                  !a.lido ? "bg-muted/40" : ""
                }`}
              >
                {iconePorTipo(a.tipo)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{a.titulo}</p>
                    {!a.lido && <Badge variant="secondary">Novo</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{a.mensagem}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatDateTime(a.criadoEm)} · {a.tipo.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
