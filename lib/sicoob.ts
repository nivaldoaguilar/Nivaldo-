import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.SICOOB_BASE_URL ?? "https://openapi.sicoob.com.br";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

export type SicoobAccount = {
  accountId: string;
  number: string;
  branch: string;
  type: string;
};

export type SicoobTransaction = {
  transactionId: string;
  date: string;
  description: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
};

export function getAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SICOOB_CLIENT_ID ?? "",
    redirect_uri: process.env.SICOOB_REDIRECT_URI ?? "",
    scope: "accounts transactions",
    state,
  });
  return `${BASE_URL}/auth/openbanking/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.SICOOB_REDIRECT_URI ?? "",
    client_id: process.env.SICOOB_CLIENT_ID ?? "",
    client_secret: process.env.SICOOB_CLIENT_SECRET ?? "",
  });

  const res = await fetch(`${BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error(`Falha ao trocar código por token: ${res.status}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.SICOOB_CLIENT_ID ?? "",
    client_secret: process.env.SICOOB_CLIENT_SECRET ?? "",
  });

  const res = await fetch(`${BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error(`Falha ao renovar token: ${res.status}`);
  return res.json();
}

async function getValidAccessToken(contaId: string): Promise<string> {
  const conta = await prisma.contaBancaria.findUnique({ where: { id: contaId } });
  if (!conta?.accessToken) throw new Error("Conta não autorizada no Open Finance");

  const expirado =
    conta.tokenExpiresAt && conta.tokenExpiresAt.getTime() < Date.now() + 60_000;

  if (expirado && conta.refreshToken) {
    const novo = await refreshAccessToken(conta.refreshToken);
    await prisma.contaBancaria.update({
      where: { id: contaId },
      data: {
        accessToken: novo.access_token,
        refreshToken: novo.refresh_token,
        tokenExpiresAt: new Date(Date.now() + novo.expires_in * 1000),
      },
    });
    return novo.access_token;
  }

  return conta.accessToken;
}

export async function listarContasSicoob(contaId: string): Promise<SicoobAccount[]> {
  const token = await getValidAccessToken(contaId);
  const res = await fetch(`${BASE_URL}/open-banking/accounts/v2/accounts`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Falha ao listar contas: ${res.status}`);
  const data = await res.json();
  return data.accounts ?? [];
}

export async function buscarTransacoesSicoob(
  contaId: string,
  accountId: string,
  from: string,
  to: string,
): Promise<SicoobTransaction[]> {
  const token = await getValidAccessToken(contaId);
  const params = new URLSearchParams({ fromBookingDate: from, toBookingDate: to });
  const res = await fetch(
    `${BASE_URL}/open-banking/accounts/v2/accounts/${accountId}/transactions?${params}`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Falha ao buscar transações: ${res.status}`);
  const data = await res.json();
  return data.transactions ?? [];
}

const QUALITY_PATTERNS = ["quality", "gest imob", "alto de sao carlos", "gestao imob"];

export function identificarRepasseQuality(descricao: string): boolean {
  const lower = descricao.toLowerCase();
  return QUALITY_PATTERNS.some((p) => lower.includes(p));
}
