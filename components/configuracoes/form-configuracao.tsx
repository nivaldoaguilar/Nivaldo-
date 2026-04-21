"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  config: {
    id: string | null;
    emailNotificacoes: string;
    diasToleranciaAtraso: number;
    sicoobClientId: string;
    sicoobRedirectUri: string;
  };
};

export function FormConfiguracao({ config }: Props) {
  const router = useRouter();
  const [state, setState] = useState(config);
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/configuracoes", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        emailNotificacoes: state.emailNotificacoes,
        diasToleranciaAtraso: state.diasToleranciaAtraso,
        sicoobClientId: state.sicoobClientId,
        sicoobClientSecret: clientSecret || null,
        sicoobRedirectUri: state.sicoobRedirectUri,
      }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Configurações salvas");
      setClientSecret("");
      router.refresh();
    } else toast.error("Falha ao salvar");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="email">E-mail para notificações</Label>
        <Input
          id="email"
          type="email"
          value={state.emailNotificacoes}
          onChange={(e) => setState({ ...state, emailNotificacoes: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dias">Dias de tolerância para atraso</Label>
        <Input
          id="dias"
          type="number"
          min={0}
          max={30}
          value={state.diasToleranciaAtraso}
          onChange={(e) => setState({ ...state, diasToleranciaAtraso: Number(e.target.value) })}
        />
      </div>

      <div className="sm:col-span-2">
        <h3 className="mb-3 font-semibold">Sicoob Open Finance</h3>
      </div>
      <div className="space-y-2">
        <Label>Client ID</Label>
        <Input
          value={state.sicoobClientId}
          onChange={(e) => setState({ ...state, sicoobClientId: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Client Secret</Label>
        <Input
          type="password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder="Digite para atualizar"
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Redirect URI</Label>
        <Input
          value={state.sicoobRedirectUri}
          onChange={(e) => setState({ ...state, sicoobRedirectUri: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </form>
  );
}
