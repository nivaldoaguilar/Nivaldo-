import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { executarConciliacao } from "@/lib/conciliacao";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resultado = await executarConciliacao(params.id);
  return NextResponse.json(resultado);
}
