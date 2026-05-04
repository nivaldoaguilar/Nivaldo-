import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { obterEmpreendimentoAtivo } from "@/lib/empreendimento-ativo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/utils";
import { UploadPrestacaoDialog } from "@/components/prestacao/upload-prestacao-dialog";

export const dynamic = "force-dynamic";

export default async function PrestacaoPage() {
  const { empreendimentoAtivo } = await obterEmpreendimentoAtivo();
  if (!empreendimentoAtivo) return <p>Selecione um empreendimento.</p>;

  const prestacoes = await prisma.prestacaoDeContas.findMany({
    where: { empreendimentoId: empreendimentoAtivo.id },
    orderBy: [{ anoReferencia: "desc" }, { mesReferencia: "desc" }],
    take: 100,
    select: {
      id: true,
      mesReferencia: true,
      anoReferencia: true,
      arquivoNome: true,
      dataImportacao: true,
      totalRecebidoQuality: true,
      statusConciliacao: true,
      _count: { select: { divergencias: true, itens: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prestação de Contas Quality</h1>
          <p className="text-sm text-muted-foreground">
            {empreendimentoAtivo.nome} · Histórico de conciliações
          </p>
        </div>
        <UploadPrestacaoDialog empreendimentoId={empreendimentoAtivo.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prestações ({prestacoes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referência</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Importada</TableHead>
                <TableHead>Total Quality</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Divergências</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prestacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Nenhuma prestação importada
                  </TableCell>
                </TableRow>
              ) : (
                prestacoes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link href={`/prestacao/${p.id}`} className="hover:underline">
                        {formatMonthYear(p.mesReferencia, p.anoReferencia)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {p.arquivoNome}
                    </TableCell>
                    <TableCell>{formatDate(p.dataImportacao)}</TableCell>
                    <TableCell>{formatCurrency(p.totalRecebidoQuality.toString())}</TableCell>
                    <TableCell>{p._count.itens}</TableCell>
                    <TableCell>{p._count.divergencias}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.statusConciliacao === "CONCILIADO_OK"
                            ? "success"
                            : p.statusConciliacao === "CONCILIADO_DIVERGENCIAS"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {p.statusConciliacao.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
