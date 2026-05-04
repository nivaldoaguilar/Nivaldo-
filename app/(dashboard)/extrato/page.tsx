import { prisma } from "@/lib/prisma";
import { obterEmpreendimentoAtivo } from "@/lib/empreendimento-ativo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SincronizarButton } from "@/components/extrato/sincronizar-button";
import { FiltrosExtrato } from "@/components/extrato/filtros-extrato";

export const revalidate = 30;

export default async function ExtratoPage({
  searchParams,
}: {
  searchParams: { contaId?: string; de?: string; ate?: string };
}) {
  const { empreendimentoAtivo } = await obterEmpreendimentoAtivo();
  if (!empreendimentoAtivo) {
    return <p>Selecione um empreendimento.</p>;
  }

  const contas = await prisma.contaBancaria.findMany({
    where: { empreendimentoId: empreendimentoAtivo.id, ativa: true },
    orderBy: { apelido: "asc" },
  });

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

  const de = searchParams.de ? new Date(searchParams.de) : inicioMes;
  const ate = searchParams.ate ? new Date(searchParams.ate) : fimMes;

  const whereTx: {
    contaBancariaId?: string | { in: string[] };
    data: { gte: Date; lte: Date };
  } = { data: { gte: de, lte: ate } };
  if (searchParams.contaId) whereTx.contaBancariaId = searchParams.contaId;
  else whereTx.contaBancariaId = { in: contas.map((c) => c.id) };

  const transacoes = await prisma.transacao.findMany({
    where: whereTx,
    orderBy: { data: "desc" },
    include: { contaBancaria: true },
  });

  // Saldo (simplificado: soma de créditos menos débitos)
  const saldos = contas.map((conta) => {
    const txs = transacoes.filter((t) => t.contaBancariaId === conta.id);
    const saldo = txs.reduce((acc, t) => {
      const v = Number(t.valor);
      return t.tipo === "CREDITO" ? acc + v : acc - v;
    }, 0);
    return { conta, saldo };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Extrato</h1>
          <p className="text-sm text-muted-foreground">
            {empreendimentoAtivo.nome} · {contas.length} conta(s) Sicoob
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {saldos.map(({ conta, saldo }) => (
          <Card key={conta.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{conta.apelido}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {conta.banco} · Ag. {conta.agencia} · Conta {conta.conta}
              </p>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Saldo período</p>
                <p className="text-xl font-bold">{formatCurrency(saldo)}</p>
                {conta.ultimaSincronizacao && (
                  <p className="text-[10px] text-muted-foreground">
                    Sincronizado em {formatDate(conta.ultimaSincronizacao)}
                  </p>
                )}
              </div>
              <SincronizarButton contaId={conta.id} autorizada={!!conta.accessToken} />
            </CardContent>
          </Card>
        ))}
      </div>

      <FiltrosExtrato
        contas={contas.map((c) => ({ id: c.id, apelido: c.apelido }))}
        contaIdAtual={searchParams.contaId}
      />

      <Card>
        <CardHeader>
          <CardTitle>Transações ({transacoes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Nenhuma transação no período
                  </TableCell>
                </TableRow>
              ) : (
                transacoes.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(t.data)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[300px]">{t.descricao}</span>
                        {t.identificadaComoRepasse && (
                          <Badge variant="success">Quality</Badge>
                        )}
                        {t.prestacaoDeContasId && (
                          <Badge variant="outline">Vinculada</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{t.contaBancaria.apelido}</TableCell>
                    <TableCell>
                      <Badge variant={t.tipo === "CREDITO" ? "success" : "secondary"}>
                        {t.tipo === "CREDITO" ? "Crédito" : "Débito"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        t.tipo === "CREDITO" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {t.tipo === "CREDITO" ? "+" : "-"}
                      {formatCurrency(t.valor.toString())}
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
