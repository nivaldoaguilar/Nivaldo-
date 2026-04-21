"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
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

export function UploadPrestacaoDialog({ empreendimentoId }: { empreendimentoId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.append("empreendimentoId", empreendimentoId);

    setLoading(true);
    const res = await fetch("/api/prestacao/upload", { method: "POST", body: fd });
    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      toast.success(
        `${data.itensImportados} itens importados · ${data.resultado.totalDivergencias} divergência(s)`,
      );
      setOpen(false);
      router.refresh();
      router.push(`/prestacao/${data.prestacaoId}`);
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error("Falha no upload", { description: JSON.stringify(err) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Importar prestação
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Importar prestação Quality</DialogTitle>
            <DialogDescription>
              Faça upload do Excel/CSV mensal. O sistema detecta as colunas automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="arquivo">Arquivo *</Label>
              <Input id="arquivo" name="arquivo" type="file" accept=".xlsx,.xls,.csv" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mes">Mês referência *</Label>
              <Input id="mes" name="mes" type="number" min={1} max={12} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ano">Ano referência *</Label>
              <Input id="ano" name="ano" type="number" min={2020} max={2100} required />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="dataEnvio">Data envio pela Quality</Label>
              <Input id="dataEnvio" name="dataEnvio" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Importando..." : "Importar e conciliar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
