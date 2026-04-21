"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { EmpreendimentoSwitcher } from "./empreendimento-switcher";
import { Button } from "@/components/ui/button";

export function Header({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <span className="text-lg font-bold tracking-tight">Nivaldo</span>
      </div>
      <div className="flex-1" />
      <EmpreendimentoSwitcher />
      <div className="hidden items-center gap-2 md:flex">
        <span className="text-xs text-muted-foreground">{userEmail}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
