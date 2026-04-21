"use client";

import { Link2, RefreshCcw, Building } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

type Conta = {
  id: string;
  apelido: string;
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: "CORRENTE" | "POUPANCA";
  ativa: boolean;
  autorizada: boolean;
  empreendimentoNome: string;
  ultimaSincronizacao: Date | null;
};

export function ContasBancariasGrid({ contas }: { contas: Conta[] }) {
  if (contas.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nenhuma conta cadastrada. As contas são criadas com os empreendimentos.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {contas.map((c) => (
        <Card key={c.id}>
          <CardContent className="p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{c.apelido}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.banco} · Ag {c.agencia} · Conta {c.conta}
                </p>
                <p className="text-[10px] text-muted-foreground">{c.empreendimentoNome}</p>
              </div>
              <Badge variant={c.autorizada ? "success" : "secondary"}>
                {c.autorizada ? "Autorizada" : "Pendente"}
              </Badge>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-[10px] text-muted-foreground">
                {c.ultimaSincronizacao
                  ? `Última sync: ${formatDateTime(c.ultimaSincronizacao)}`
                  : "Nunca sincronizada"}
              </p>
              <Button size="sm" variant="outline" asChild>
                <a href={`/api/bank/authorize?contaId=${c.id}`}>
                  <Link2 className="mr-2 h-3 w-3" />
                  {c.autorizada ? "Reautorizar" : "Autorizar"}
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
