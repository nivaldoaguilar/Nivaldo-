"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CORES = ["#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#a855f7", "#14b8a6", "#f97316"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendimento: {
    id: string;
    nome: string;
    percentualSocio: number;
    descricao: string | null;
    cor: string;
  };
};

export function EditarEmpreendimentoDialog({ open, onOpenChange, empreendimento }: Props) {
  const router = useRouter();
  const [nome, setNome] = useState(empreendimento.nome);
  const [percentual, setPercentual] = useState(String(empreendimento.percentualSocio));
  const [descricao, setDescricao] = useState(empreendimento.descricao ?? "");
  const [cor, setCor] = useState(empreendimento.cor);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/empreendimentos/${empreendimento.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        nome,
        percentualSocio: Number(percentual),
        descricao: descricao || null,
        cor,
      }),
    });
    setLoading(false);

    if (res.ok) {
      toast.success("Empreendimento atualizado");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error("Falha ao atualizar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Editar empreendimento</DialogTitle>
            <DialogDescription>
              Alterar o percentual recalcula automaticamente as métricas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome-edit">Nome</Label>
              <Input id="nome-edit" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perc-edit">Percentual societário (%)</Label>
              <Input
                id="perc-edit"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={percentual}
                onChange={(e) => setPercentual(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc-edit">Descrição</Label>
              <Textarea id="desc-edit" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cor identificadora</Label>
              <div className="flex gap-2">
                {CORES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 ${cor === c ? "border-foreground" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setCor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
