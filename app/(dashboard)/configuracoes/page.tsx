import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormConfiguracao } from "@/components/configuracoes/form-configuracao";
import { ContasBancariasGrid } from "@/components/configuracoes/contas-bancarias-grid";

export const revalidate = 30;

export default async function ConfiguracoesPage() {
  const config = await prisma.configuracao.findFirst();

  const contas = await prisma.contaBancaria.findMany({
    include: { empreendimento: true },
    orderBy: { apelido: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Preferências do sistema, integração Sicoob e contas bancárias.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preferências gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <FormConfiguracao
            config={{
              id: config?.id ?? null,
              emailNotificacoes: config?.emailNotificacoes ?? "",
              diasToleranciaAtraso: config?.diasToleranciaAtraso ?? 5,
              sicoobClientId: config?.sicoobClientId ?? "",
              sicoobRedirectUri: config?.sicoobRedirectUri ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contas bancárias</CardTitle>
        </CardHeader>
        <CardContent>
          <ContasBancariasGrid
            contas={contas.map((c) => ({
              id: c.id,
              apelido: c.apelido,
              banco: c.banco,
              agencia: c.agencia,
              conta: c.conta,
              tipoConta: c.tipoConta,
              ativa: c.ativa,
              autorizada: !!c.accessToken,
              empreendimentoNome: c.empreendimento?.nome ?? "Sem empreendimento",
              ultimaSincronizacao: c.ultimaSincronizacao,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
