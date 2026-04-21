"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  contas: { id: string; apelido: string }[];
  contaIdAtual?: string;
};

export function FiltrosExtrato({ contas, contaIdAtual }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function atualizar(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (!value || value === "TODAS") next.delete(key);
    else next.set(key, value);
    router.push(`/extrato?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Conta</Label>
        <Select
          value={contaIdAtual ?? "TODAS"}
          onValueChange={(v) => atualizar("contaId", v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Todas as contas</SelectItem>
            {contas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.apelido}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">De</Label>
        <Input
          type="date"
          defaultValue={params.get("de") ?? ""}
          onChange={(e) => atualizar("de", e.target.value)}
          className="w-[160px]"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Até</Label>
        <Input
          type="date"
          defaultValue={params.get("ate") ?? ""}
          onChange={(e) => atualizar("ate", e.target.value)}
          className="w-[160px]"
        />
      </div>
    </div>
  );
}
