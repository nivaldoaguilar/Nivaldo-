"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown, Mail, RefreshCcw, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AcoesPrestacao({ prestacaoId }: { prestacaoId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function reconciliar() {
    setLoading("reconciliar");
    const res = await fetch(`/api/prestacao/${prestacaoId}/conciliar`, { method: "POST" });
    setLoading(null);
    if (res.ok) {
      toast.success("Conciliação refeita");
      router.refresh();
    } else toast.error("Falha");
  }

  async function enviarEmail() {
    setLoading("email");
    const res = await fetch(`/api/reports/email`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prestacaoId }),
    });
    setLoading(null);
    if (res.ok) toast.success("E-mail enviado");
    else toast.error("Falha ao enviar");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={reconciliar} disabled={loading === "reconciliar"}>
        <RefreshCcw className={`mr-2 h-4 w-4 ${loading === "reconciliar" ? "animate-spin" : ""}`} />
        Reconciliar
      </Button>
      <Button size="sm" variant="outline" asChild>
        <a href={`/api/reports/pdf?prestacaoId=${prestacaoId}`} target="_blank" rel="noreferrer">
          <FileDown className="mr-2 h-4 w-4" /> PDF
        </a>
      </Button>
      <Button size="sm" variant="outline" asChild>
        <a href={`/api/reports/excel?prestacaoId=${prestacaoId}`}>
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
        </a>
      </Button>
      <Button size="sm" onClick={enviarEmail} disabled={loading === "email"}>
        <Mail className="mr-2 h-4 w-4" /> Enviar por e-mail
      </Button>
    </div>
  );
}
