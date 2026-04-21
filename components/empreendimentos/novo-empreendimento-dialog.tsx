"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CORES = ["#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#a855f7", "#14b8a6", "#f97316"];

export function NovoEmpreendimentoDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [percentual, setPercentual] = useState("36");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState(CORES[0]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/empreendimentos", {
      method: "POST",
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
      toast.success("Empreendimento criado");
      setOpen(false);
      setNome("");
      setPercentual("36");
      setDescricao("");
      setCor(CORES[0]);
      router.refresh();
    } else {
      toast.error("Falha ao criar empreendimento");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Empreendimento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Novo empreendimento</DialogTitle>
            <DialogDescription>
              Cadastre um novo empreendimento com seu percentual societário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentual">Percentual societário (%) *</Label>
              <Input
                id="percentual"
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
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
