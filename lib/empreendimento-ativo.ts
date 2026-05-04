import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "empreendimento_ativo_id";

export const obterEmpreendimentoAtivo = cache(async function obterEmpreendimentoAtivo() {
  const cookieStore = cookies();
  const id = cookieStore.get(COOKIE_NAME)?.value;

  const empreendimentos = await prisma.empreendimento.findMany({
    where: { arquivado: false },
    orderBy: { nome: "asc" },
  });

  if (!empreendimentos.length) {
    return { empreendimentoAtivo: null, empreendimentos };
  }

  const ativo = id
    ? empreendimentos.find((e) => e.id === id) ?? empreendimentos[0]
    : empreendimentos[0];

  return {
    empreendimentoAtivo: ativo,
    empreendimentos,
  };
});
