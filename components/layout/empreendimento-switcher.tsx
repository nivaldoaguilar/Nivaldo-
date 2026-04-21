"use client";

import { useState } from "react";
import { Check, ChevronDown, Plus, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEmpreendimento } from "@/components/providers/empreendimento-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function EmpreendimentoSwitcher() {
  const router = useRouter();
  const { empreendimentoAtivo, empreendimentos, setEmpreendimentoAtivo } = useEmpreendimento();
  const [open, setOpen] = useState(false);

  if (!empreendimentoAtivo) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/empreendimentos")}
        className="h-9"
      >
        <Plus className="mr-2 h-4 w-4" />
        Criar empreendimento
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 justify-between gap-2 min-w-[200px] max-w-[260px]"
        >
          <span
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] text-white"
            style={{ backgroundColor: empreendimentoAtivo.cor }}
          >
            <Building2 className="h-3 w-3" />
          </span>
          <span className="flex-1 truncate text-left">{empreendimentoAtivo.nome}</span>
          <span className="text-xs text-muted-foreground">
            {empreendimentoAtivo.percentualSocio}%
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[260px]">
        {empreendimentos.map((emp) => (
          <DropdownMenuItem
            key={emp.id}
            onSelect={() => {
              setEmpreendimentoAtivo(emp.id);
              setOpen(false);
            }}
            className="flex items-center gap-2"
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: emp.cor }}
            />
            <span className="flex-1 truncate">{emp.nome}</span>
            <span className="text-xs text-muted-foreground">{emp.percentualSocio}%</span>
            {emp.id === empreendimentoAtivo.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            setOpen(false);
            router.push("/empreendimentos");
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo empreendimento
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
