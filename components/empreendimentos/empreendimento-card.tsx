"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Pencil, Archive } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditarEmpreendimentoDialog } from "./editar-empreendimento-dialog";

type Props = {
  id: string;
  nome: string;
  percentualSocio: number;
  descricao: string | null;
  cor: string;
  totalLotes: number;
  carteiraAtivaFormatada: string;
};

export function EmpreendimentoCard(props: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  async function arquivar() {
    if (!confirm(`Arquivar "${props.nome}"? Ele será ocultado do seletor.`)) return;
    const res = await fetch(`/api/empreendimentos/${props.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Empreendimento arquivado");
      router.refresh();
    } else {
      toast.error("Falha ao arquivar");
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="h-2" style={{ backgroundColor: props.cor }} />
        <CardContent className="p-5">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: props.cor }}
              >
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold leading-tight">{props.nome}</h3>
                <p className="text-xs text-muted-foreground">
                  {props.percentualSocio}% societário
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={arquivar}>
                <Archive className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {props.descricao && (
            <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{props.descricao}</p>
          )}

          <div className="grid grid-cols-2 gap-2 border-t pt-3">
            <div>
              <p className="text-xs text-muted-foreground">Lotes</p>
              <p className="font-semibold">{props.totalLotes}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Carteira ativa</p>
              <p className="font-semibold">{props.carteiraAtivaFormatada}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditarEmpreendimentoDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        empreendimento={{
          id: props.id,
          nome: props.nome,
          percentualSocio: props.percentualSocio,
          descricao: props.descricao,
          cor: props.cor,
        }}
      />
    </>
  );
}
