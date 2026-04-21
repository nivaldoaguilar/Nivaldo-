import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BaixaManualButton } from "@/components/carteira/baixa-manual-button";

export const dynamic = "force-dynamic";

export default async function LoteDetalhePage({ params }: { params: { id: string } }) {
  const lote = await prisma.lote.findUnique({
    where: { id: params.id },
    include: {
      empreendimento: true,
      contrato: {
        include: {
          parcelas: { orderBy: { numeroParcela: "asc" } },
        },
      },
    },
  });

  if (!lote) notFound();

  const contrato = lote.contrato;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/carteira">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Lote {lote.identificacao}</h1>
        <p className="text-sm text-muted-foreground">
          {lote.empreendimento.nome} · Quadra {lote.quadra} · Lote {lote.numero}
          {lote.areaM2 && ` · ${lote.areaM2.toFixed(0)}m²`}
        </p>
      </div>

      {contrato ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Contrato</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Info label="Comprador" value={contrato.nomeComprador} />
              <Info label="CPF" value={contrato.cpfComprador ?? "-"} />
              <Info label="Telefone" value={contrato.telefoneComprador ?? "-"} />
              <Info label="E-mail" value={contrato.emailComprador ?? "-"} />
              <Info label="Valor total" value={formatCurrency(contrato.valorTotal.toString())} />
              <Info label="Entrada" value={formatCurrency(contrato.valorEntrada.toString())} />
              <Info label="Valor parcela" value={formatCurrency(contrato.valorParcela.toString())} />
              <Info label="Quantidade parcelas" value={String(contrato.quantidadeParcelas)} />
              <Info label="Dia vencimento" value={`Dia ${contrato.diaVencimento}`} />
              <Info label="Assinatura" value={formatDate(contrato.dataAssinatura)} />
              <Info label="1ª parcela" value={formatDate(contrato.dataVencimento1Parcela)} />
              <Info
                label="Status"
                value={
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
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parcelas ({contrato.parcelas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Recebimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contrato.parcelas.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.numeroParcela}</TableCell>
                      <TableCell>{formatDate(p.dataVencimento)}</TableCell>
                      <TableCell>{formatCurrency(p.valorOriginal.toString())}</TableCell>
                      <TableCell>{formatDate(p.dataRecebimento)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === "RECEBIDA" ||
                            p.status === "BAIXA_AUTOMATICA" ||
                            p.status === "BAIXA_MANUAL"
                              ? "success"
                              : p.status === "ATRASADA"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {p.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === "PENDENTE" || p.status === "ATRASADA" ? (
                          <BaixaManualButton parcelaId={p.id} />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Este lote ainda não possui contrato.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="font-medium">{value}</div>
    </div>
  );
}
