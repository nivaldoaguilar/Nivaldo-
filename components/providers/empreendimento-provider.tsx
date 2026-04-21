"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type EmpreendimentoResumo = {
  id: string;
  nome: string;
  percentualSocio: number;
  cor: string;
  arquivado?: boolean;
};

type EmpreendimentoContextValue = {
  empreendimentoAtivo: EmpreendimentoResumo | null;
  empreendimentos: EmpreendimentoResumo[];
  setEmpreendimentoAtivo: (id: string) => void;
  recarregarEmpreendimentos: () => Promise<void>;
  loading: boolean;
};

const EmpreendimentoContext = createContext<EmpreendimentoContextValue | null>(null);

export function useEmpreendimento() {
  const ctx = useContext(EmpreendimentoContext);
  if (!ctx) throw new Error("useEmpreendimento deve ser usado dentro do EmpreendimentoProvider");
  return ctx;
}

const COOKIE_NAME = "empreendimento_ativo_id";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function EmpreendimentoProvider({
  children,
  initialEmpreendimentos,
  initialAtivoId,
}: {
  children: React.ReactNode;
  initialEmpreendimentos: EmpreendimentoResumo[];
  initialAtivoId?: string | null;
}) {
  const router = useRouter();
  const [empreendimentos, setEmpreendimentos] = useState<EmpreendimentoResumo[]>(initialEmpreendimentos);
  const [ativoId, setAtivoId] = useState<string | null>(() => {
    if (initialAtivoId) return initialAtivoId;
    const cookieId = getCookie(COOKIE_NAME);
    if (cookieId) return cookieId;
    return initialEmpreendimentos[0]?.id ?? null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ativoId) setCookie(COOKIE_NAME, ativoId);
  }, [ativoId]);

  const setEmpreendimentoAtivo = useCallback(
    (id: string) => {
      setAtivoId(id);
      setCookie(COOKIE_NAME, id);
      router.refresh();
    },
    [router],
  );

  const recarregarEmpreendimentos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/empreendimentos", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as EmpreendimentoResumo[];
        setEmpreendimentos(data.filter((e) => !e.arquivado));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const empreendimentoAtivo = useMemo(() => {
    return empreendimentos.find((e) => e.id === ativoId) ?? empreendimentos[0] ?? null;
  }, [empreendimentos, ativoId]);

  const value = useMemo<EmpreendimentoContextValue>(
    () => ({
      empreendimentoAtivo,
      empreendimentos,
      setEmpreendimentoAtivo,
      recarregarEmpreendimentos,
      loading,
    }),
    [empreendimentoAtivo, empreendimentos, setEmpreendimentoAtivo, recarregarEmpreendimentos, loading],
  );

  return <EmpreendimentoContext.Provider value={value}>{children}</EmpreendimentoContext.Provider>;
}
