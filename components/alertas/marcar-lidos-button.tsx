"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function MarcarLidosButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function marcarTodos() {
    setLoading(true);
    const res = await fetch("/api/alertas/marcar-lidos", { method: "POST" });
    setLoading(false);
    if (res.ok) {
      toast.success("Todos marcados como lidos");
      router.refresh();
    } else toast.error("Falha");
  }

  return (
    <Button variant="outline" onClick={marcarTodos} disabled={loading}>
      <CheckCheck className="mr-2 h-4 w-4" />
      Marcar todos como lidos
    </Button>
  );
}
