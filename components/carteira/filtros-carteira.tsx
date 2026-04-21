"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FiltrosCarteira() {
  const router = useRouter();
  const params = useSearchParams();

  function setFiltro(nome: "status" | "tipo", valor: string) {
    const next = new URLSearchParams(params);
    if (valor === "TODOS") next.delete(nome);
    else next.set(nome, valor);
    router.push(`/carteira?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select value={params.get("status") ?? "TODOS"} onValueChange={(v) => setFiltro("status", v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODOS">Todos os status</SelectItem>
          <SelectItem value="EM_DIA">Em dia</SelectItem>
          <SelectItem value="INADIMPLENTE">Inadimplente</SelectItem>
          <SelectItem value="QUITADO">Quitado</SelectItem>
          <SelectItem value="CANCELADO">Cancelado</SelectItem>
        </SelectContent>
      </Select>

      <Select value={params.get("tipo") ?? "TODOS"} onValueChange={(v) => setFiltro("tipo", v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODOS">Todos os tipos</SelectItem>
          <SelectItem value="SOCIETARIO">Societário</SelectItem>
          <SelectItem value="PESSOAL">100% pessoal</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
