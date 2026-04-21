"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useEmpreendimento } from "@/components/providers/empreendimento-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NovoLotePage() {
  const router = useRouter();
  const { empreendimentoAtivo } = useEmpreendimento();
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState<"SOCIETARIO" | "PESSOAL">("SOCIETARIO");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!empreendimentoAtivo) return;

    const fd = new FormData(e.currentTarget);
    setLoading(true);

    const payload = {
      empreendimentoId: empreendimentoAtivo.id,
      quadra: String(fd.get("quadra") ?? ""),
      numero: String(fd.get("numero") ?? ""),
      areaM2: fd.get("areaM2") ? Number(fd.get("areaM2")) : undefined,
      tipoPropriedade: tipo,
      contrato: {
        nomeComprador: String(fd.get("nomeComprador") ?? ""),
        cpfComprador: String(fd.get("cpfComprador") ?? "") || null,
        telefoneComprador: String(fd.get("telefoneComprador") ?? "") || null,
        emailComprador: String(fd.get("emailComprador") ?? "") || null,
        valorTotal: Number(fd.get("valorTotal") ?? 0),
        valorEntrada: Number(fd.get("valorEntrada") ?? 0),
        dataAssinatura: String(fd.get("dataAssinatura") ?? ""),
        dataVencimento1Parcela: String(fd.get("dataVencimento1Parcela") ?? ""),
        quantidadeParcelas: Number(fd.get("quantidadeParcelas") ?? 0),
        valorParcela: Number(fd.get("valorParcela") ?? 0),
        diaVencimento: Number(fd.get("diaVencimento") ?? 10),
        observacoes: String(fd.get("observacoes") ?? "") || null,
      },
    };

    const res = await fetch("/api/carteira/lotes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (res.ok) {
      toast.success("Lote e contrato criados");
      router.push("/carteira");
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error("Falha ao criar lote", { description: JSON.stringify(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/carteira">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Novo Lote</h1>
        <p className="text-sm text-muted-foreground">
          {empreendimentoAtivo?.nome ?? "Nenhum empreendimento selecionado"}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do lote</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="quadra">Quadra *</Label>
              <Input id="quadra" name="quadra" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero">Número *</Label>
              <Input id="numero" name="numero" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="areaM2">Área (m²)</Label>
              <Input id="areaM2" name="areaM2" type="number" step="0.01" />
            </div>
            <div className="space-y-2">
              <Label>Tipo de propriedade *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as "SOCIETARIO" | "PESSOAL")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOCIETARIO">Societário</SelectItem>
                  <SelectItem value="PESSOAL">100% pessoal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contrato</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nomeComprador">Nome do comprador *</Label>
              <Input id="nomeComprador" name="nomeComprador" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpfComprador">CPF</Label>
              <Input id="cpfComprador" name="cpfComprador" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefoneComprador">Telefone</Label>
              <Input id="telefoneComprador" name="telefoneComprador" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="emailComprador">E-mail</Label>
              <Input id="emailComprador" name="emailComprador" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorTotal">Valor total *</Label>
              <Input id="valorTotal" name="valorTotal" type="number" step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorEntrada">Valor de entrada</Label>
              <Input id="valorEntrada" name="valorEntrada" type="number" step="0.01" defaultValue={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataAssinatura">Data assinatura *</Label>
              <Input id="dataAssinatura" name="dataAssinatura" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataVencimento1Parcela">1º vencimento *</Label>
              <Input id="dataVencimento1Parcela" name="dataVencimento1Parcela" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diaVencimento">Dia vencimento *</Label>
              <Input id="diaVencimento" name="diaVencimento" type="number" min={1} max={31} defaultValue={10} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidadeParcelas">Qtd. parcelas *</Label>
              <Input id="quantidadeParcelas" name="quantidadeParcelas" type="number" min={1} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorParcela">Valor parcela *</Label>
              <Input id="valorParcela" name="valorParcela" type="number" step="0.01" required />
            </div>
            <div className="space-y-2 sm:col-span-2 md:col-span-3">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" name="observacoes" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/carteira">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Criar lote"}
          </Button>
        </div>
      </form>
    </div>
  );
}
