import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { EmpreendimentoCard } from "@/components/empreendimentos/empreendimento-card";
import { NovoEmpreendimentoDialog } from "@/components/empreendimentos/novo-empreendimento-dialog";

export const dynamic = "force-dynamic";

export default async function EmpreendimentosPage() {
  const empreendimentos = await prisma.empreendimento.findMany({
    where: { arquivado: false },
    orderBy: { nome: "asc" },
    include: {
      lotes: {
        include: {
          contrato: {
            include: { parcelas: true },
          },
        },
      },
    },
  });

  const dados = empreendimentos.map((emp) => {
    const totalLotes = emp.lotes.length;
    const carteiraAtiva = emp.lotes.reduce((acc, lote) => {
      if (!lote.contrato) return acc;
      if (lote.contrato.status === "QUITADO" || lote.contrato.status === "CANCELADO") return acc;
      return acc + Number(lote.contrato.valorTotal);
    }, 0);

    return {
      id: emp.id,
      nome: emp.nome,
      percentualSocio: emp.percentualSocio,
      descricao: emp.descricao,
      cor: emp.cor,
      totalLotes,
      carteiraAtivaFormatada: formatCurrency(carteiraAtiva),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empreendimentos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os empreendimentos cadastrados e seu percentual societário
          </p>
        </div>
        <NovoEmpreendimentoDialog />
      </div>

      {dados.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum empreendimento cadastrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Clique em &ldquo;+ Novo Empreendimento&rdquo; para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dados.map((emp) => (
            <EmpreendimentoCard key={emp.id} {...emp} />
          ))}
        </div>
      )}
    </div>
  );
}
