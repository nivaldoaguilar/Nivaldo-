import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obterEmpreendimentoAtivo } from "@/lib/empreendimento-ativo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { StatusParcela } from "@prisma/client";
import { FiltrosCarteira } from "@/components/carteira/filtros-carteira";

export const revalidate = 30;

type SearchParams = { status?: string; tipo?: string };

export default async function CarteiraPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { empreendimentoAtivo } = await obterEmpreendimentoAtivo();

  if (!empreendimentoAtivo) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Carteira</h1>
        <p className="text-sm text-muted-foreground">Nenhum empreendimento selecionado.</p>
      </div>
    );
  }

  const where: {
    empreendimentoId: string;
    tipoPropriedade?: "SOCIETARIO" | "PESSOAL";
    contrato?: { status: "EM_DIA" | "INADIMPLENTE" | "QUITADO" | "CANCELADO" };
  } = {
    empreendimentoId: empreendimentoAtivo.id,
  };

  if (searchParams.tipo === "SOCIETARIO" || searchParams.tipo === "PESSOAL") {
    where.tipoPropriedade = searchParams.tipo;
  }
  if (
    searchParams.status === "EM_DIA" ||
    searchParams.status === "INADIMPLENTE" ||
    searchParams.status === "QUITADO" ||
    searchParams.status === "CANCELADO"
  ) {
    where.contrato = { status: searchParams.status };
  }

  const lotes = await prisma.lote.findMany({
    where,
    orderBy: [{ quadra: "asc" }, { numero: "asc" }],
    include: {
      contrato: {
        include: { parcelas: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Carteira de Lotes</h1>
          <p className="text-sm text-muted-foreground">
            {empreendimentoAtivo.nome} · {lotes.length} lotes
          </p>
        </div>
        <Button asChild>
          <Link href="/carteira/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Lote
          </Link>
        </Button>
      </div>

      <FiltrosCarteira />

      {lotes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum lote encontrado
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lotes.map((lote) => {
            const contrato = lote.contrato;
            const totalParcelas = contrato?.parcelas.length ?? 0;
            const pagas = contrato?.parcelas.filter(
              (p) =>
                p.status === StatusParcela.RECEBIDA ||
                p.status === StatusParcela.BAIXA_AUTOMATICA ||
                p.status === StatusParcela.BAIXA_MANUAL,
            ).length ?? 0;
            const progresso = totalParcelas > 0 ? (pagas / totalParcelas) * 100 : 0;

            return (
              <Link key={lote.id} href={`/carteira/${lote.id}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold">{lote.identificacao}</h3>
                      <div className="flex items-center gap-1">
                        {lote.tipoPropriedade === "PESSOAL" ? (
                          <Badge variant="secondary">100%</Badge>
                        ) : (
                          <Badge variant="outline">{empreendimentoAtivo.percentualSocio}%</Badge>
                        )}
                        {contrato && (
                          <Badge
                            variant={
                              contrato.status === "EM_DIA"
                                ? "success"
                                : contrato.status === "INADIMPLENTE"
                                  ? "destructive"
                                  : contrato.status === "QUITADO"
                                    ? "default"
                                    : "outline"
                            }
                          >
                            {contrato.status.replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {contrato ? (
                      <>
                        <p className="mb-3 text-sm text-muted-foreground truncate">
                          {contrato.nomeComprador}
                        </p>
                        <Progress value={progresso} className="mb-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {pagas}/{totalParcelas} parcelas
                          </span>
                          <span>{formatCurrency(contrato.valorTotal.toString())}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem contrato</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
