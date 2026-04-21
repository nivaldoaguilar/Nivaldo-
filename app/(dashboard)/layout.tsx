import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { obterEmpreendimentoAtivo } from "@/lib/empreendimento-ativo";
import { EmpreendimentoProvider } from "@/components/providers/empreendimento-provider";
import { NextAuthProvider } from "@/components/providers/session-provider";
import { Header } from "@/components/layout/header";
import { SidebarNav, BottomNav } from "@/components/layout/sidebar-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { empreendimentoAtivo, empreendimentos } = await obterEmpreendimentoAtivo();

  const empreendimentosResumo = empreendimentos.map((e) => ({
    id: e.id,
    nome: e.nome,
    percentualSocio: e.percentualSocio,
    cor: e.cor,
    arquivado: e.arquivado,
  }));

  return (
    <NextAuthProvider>
      <EmpreendimentoProvider
        initialEmpreendimentos={empreendimentosResumo}
        initialAtivoId={empreendimentoAtivo?.id ?? null}
      >
        <div className="flex min-h-screen">
          <aside className="hidden w-60 shrink-0 border-r bg-muted/30 md:block">
            <div className="flex h-14 items-center gap-2 border-b px-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                N
              </div>
              <span className="font-bold tracking-tight">Carteira</span>
            </div>
            <SidebarNav />
          </aside>
          <div className="flex flex-1 flex-col">
            <Header userEmail={session.user?.email} />
            <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
            <BottomNav />
          </div>
        </div>
      </EmpreendimentoProvider>
    </NextAuthProvider>
  );
}
