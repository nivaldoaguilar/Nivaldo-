import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/utils";
import { AcoesPrestacao } from "@/components/prestacao/acoes-prestacao";

export const dynamic = "force-dynamic";

export default async function PrestacaoDetalhePage({ params }: { params: { id: string } }) {
  const prestacao = await prisma.prestacaoDeContas.findUnique({
    where: { id: params.id },
    include: {
      empreendimento: true,
      itens: { orderBy: { loteIdentificacao: "asc" } },
      divergencias: { orderBy: [{ severidade: "asc" }, { criadoEm: "desc" }] },
    },
  });

  if (!prestacao) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link href="/prestacao">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {formatMonthYear(prestacao.mesReferencia, prestacao.anoReferencia)}
          </h1>
          <p className="text-sm text-muted-foreground">{prestacao.empreendimento.nome}</p>
        </div>
        <AcoesPrestacao prestacaoId={prestacao.id} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Quality</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{formatCurrency(prestacao.totalRecebidoQuality.toString())}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Extrato</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{formatCurrency(prestacao.totalRecebidoExtrato?.toString() ?? "0")}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Status</CardTitle></CardHeader>
          <CardContent>
            <Badge
              variant={
                prestacao.statusConciliacao === "CONCILIADO_OK"
                  ? "success"
                  : prestacao.statusConciliacao === "CONCILIADO_DIVERGENCIAS"
                    ? "warning"
                    : "secondary"
              }
            >
              {prestacao.statusConciliacao.replace(/_/g, " ")}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Divergências ({prestacao.divergencias.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {prestacao.divergencias.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma divergência encontrada. Conciliação OK.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Esperado</TableHead>
                  <TableHead>Encontrado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestacao.divergencias.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Badge
                        variant={
                          d.severidade === "CRITICO"
                            ? "destructive"
                            : d.severidade === "ATENCAO"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {d.severidade}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{d.tipo.replace(/_/g, " ")}</TableCell>
                    <TableCell>{d.loteIdentificacao ?? "-"}</TableCell>
                    <TableCell className="text-sm max-w-[320px]">{d.descricao}</TableCell>
                    <TableCell>
                      {d.valorEsperado ? formatCurrency(d.valorEsperado.toString()) : "-"}
                    </TableCell>
                    <TableCell>
                      {d.valorEncontrado ? formatCurrency(d.valorEncontrado.toString()) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens importados ({prestacao.itens.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prestacao.itens.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.loteIdentificacao}</TableCell>
                  <TableCell className="text-sm">{i.nomeComprador ?? "-"}</TableCell>
                  <TableCell>{i.numeroParcela ?? "-"}</TableCell>
                  <TableCell>{formatDate(i.dataRecebimento)}</TableCell>
                  <TableCell className="text-xs">{i.statusReportado ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(i.valorRecebido.toString())}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
