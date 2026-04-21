"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FiltrosAlertas() {
  const router = useRouter();
  const params = useSearchParams();

  function atualizar(valor: string) {
    const next = new URLSearchParams(params);
    if (valor === "TODOS") next.delete("tipo");
    else next.set("tipo", valor);
    router.push(`/alertas?${next.toString()}`);
  }

  return (
    <Select value={params.get("tipo") ?? "TODOS"} onValueChange={atualizar}>
      <SelectTrigger className="w-[260px]">
        <SelectValue placeholder="Filtrar tipo" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="TODOS">Todos os tipos</SelectItem>
        <SelectItem value="DIVERGENCIA_CONCILIACAO">Divergência de conciliação</SelectItem>
        <SelectItem value="INADIMPLENCIA_NOVA">Nova inadimplência</SelectItem>
        <SelectItem value="PARCELA_VENCIDA">Parcela vencida</SelectItem>
        <SelectItem value="REPASSE_RECEBIDO">Repasse recebido</SelectItem>
      </SelectContent>
    </Select>
  );
}
