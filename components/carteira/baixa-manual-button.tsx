"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function BaixaManualButton({ parcelaId }: { parcelaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function baixar() {
    if (!confirm("Confirmar baixa manual desta parcela?")) return;
    setLoading(true);
    const res = await fetch("/api/parcelas/baixa", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ parcelaId, tipo: "manual" }),
    });
    setLoading(false);

    if (res.ok) {
      toast.success("Parcela baixada");
      router.refresh();
    } else {
      toast.error("Falha na baixa");
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={baixar} disabled={loading}>
      {loading ? "..." : "Baixar"}
    </Button>
  );
}
