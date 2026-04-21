"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SincronizarButton({ contaId, autorizada }: { contaId: string; autorizada: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!autorizada) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          window.location.href = `/api/bank/authorize?contaId=${contaId}`;
        }}
      >
        <Link2 className="mr-2 h-4 w-4" />
        Autorizar
      </Button>
    );
  }

  async function sincronizar() {
    setLoading(true);
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const res = await fetch("/api/bank/transactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contaId, from: iso(primeiroDiaMes), to: iso(hoje) }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      toast.success(`${data.novas ?? 0} nova(s) transações`);
      router.refresh();
    } else {
      toast.error("Falha ao sincronizar");
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={sincronizar} disabled={loading}>
      <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      Sincronizar
    </Button>
  );
}
