# Carteira Imobiliária · Gestão Multi-Empreendimentos

Sistema web de gestão de carteira de recebíveis imobiliários com conciliação automática
entre a planilha enviada pela **Quality** (terceirizada que administra a cobrança) e o
extrato bancário via **Sicoob Open Finance**.

Suporta múltiplos empreendimentos (São Carlos I, São Carlos II e futuros), com percentual
societário configurável por empreendimento e lotes 100% do usuário.

---

## 🛠️ Stack

- **Next.js 14** (App Router) + React 18
- **PostgreSQL** + **Prisma** ORM
- **NextAuth.js** (credenciais e-mail/senha)
- **Tailwind CSS** + **shadcn/ui** + **Recharts**
- **Sicoob Open Finance** (OAuth 2.0)
- **Resend** (e-mails)
- **@react-pdf/renderer** (PDF) + **xlsx** (Excel)
- **Vercel Cron** para jobs agendados

---

## ✅ Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ (ou conta Supabase / Neon)
- Conta Resend (para e-mails de notificação)
- Credenciais Sicoob Open Finance (Client ID / Client Secret)

---

## 🚀 Instalação local

```bash
# 1. Clonar e instalar
git clone <repo-url>
cd Nivaldo-
npm install

# 2. Configurar variáveis
cp .env.example .env
# Edite .env com: DATABASE_URL, NEXTAUTH_SECRET, SICOOB_*, RESEND_API_KEY

# 3. Banco de dados
npx prisma migrate dev --name init
npx prisma db seed

# 4. Rodar
npm run dev
```

Acesso padrão após o seed:
- **E-mail:** `admin@nivaldo.com.br`
- **Senha:** `admin123`

---

## 🔐 Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL PostgreSQL (ex: Supabase) |
| `NEXTAUTH_URL` | URL pública da app |
| `NEXTAUTH_SECRET` | Gerar com `openssl rand -base64 32` |
| `SICOOB_CLIENT_ID` | Client ID da aplicação Sicoob |
| `SICOOB_CLIENT_SECRET` | Client Secret |
| `SICOOB_REDIRECT_URI` | `https://<dominio>/api/bank/callback` |
| `SICOOB_BASE_URL` | `https://openapi.sicoob.com.br` |
| `RESEND_API_KEY` | Chave Resend |
| `EMAIL_FROM` | Remetente dos e-mails |
| `CRON_SECRET` | Segredo para proteger `/api/cron/*` |

---

## 🏦 Configuração Sicoob Open Finance

1. Cadastre-se no portal **Sicoob Developer** e crie uma aplicação de Open Finance com
   os scopes `accounts` e `transactions`.
2. Preencha em **Configurações → Sicoob Open Finance**:
   - Client ID
   - Client Secret
   - Redirect URI (deve bater com o configurado no portal)
3. Na tela **Extrato**, clique em **Autorizar** na conta desejada. O sistema redireciona
   para a tela de consentimento do Sicoob; ao autorizar, volta e armazena access/refresh
   tokens criptografados no banco.
4. Use **Sincronizar** para buscar transações. O renew de token é automático.

Fluxo OAuth implementado:
- `GET /api/bank/authorize` → redireciona para o Sicoob
- `GET /api/bank/callback` → troca `code` por tokens
- `POST /api/bank/transactions` → baixa transações, deduplica, identifica repasses
  Quality pela descrição (`quality`, `gest imob`, `alto de sao carlos`) e tenta
  **baixa automática** nas parcelas.

---

## 📊 Módulos

- **Dashboard** — métricas do empreendimento ativo, gráfico de 6 meses, status da última conciliação, alertas
- **Empreendimentos** — CRUD com percentual societário e cor identificadora
- **Carteira** — lotes + contratos + parcelas, filtros, baixa manual
- **Prestação de Contas** — upload Excel/CSV Quality, mapeamento automático, conciliação, relatório PDF/Excel, envio por e-mail
- **Extrato** — saldo das contas Sicoob, transações com badges (Quality / Vinculada)
- **Alertas** — histórico filtrado, marcar todos como lidos
- **Configurações** — e-mail, tolerância de atraso, credenciais Sicoob, contas bancárias

### Seletor global de empreendimento

Presente no header em todas as telas. Salva `empreendimento_ativo_id` em cookie HTTP
e em `EmpreendimentoContext`. Todos os dados são filtrados automaticamente.

---

## 🔔 Cron jobs (Vercel)

Configurados em `vercel.json`:

```
0 8 * * *  → /api/cron/parcelas-vencidas
```

Diariamente às 8h verifica parcelas `PENDENTE` vencidas, marca como `ATRASADA`,
atualiza status do contrato e dispara e-mail via Resend quando o atraso ultrapassa
`diasToleranciaAtraso`.

Proteger em produção com header `Authorization: Bearer $CRON_SECRET`.

---

## 📁 Estrutura

```
app/
  (auth)/login/
  (dashboard)/
    page.tsx              ← Dashboard
    empreendimentos/
    carteira/
    prestacao/
    extrato/
    alertas/
    configuracoes/
  api/
    auth/[...nextauth]/
    empreendimentos/
    carteira/
    bank/{authorize,callback,transactions}/
    prestacao/{upload,[id]/conciliar}/
    parcelas/baixa/
    reports/{pdf,excel,email}/
    cron/parcelas-vencidas/
components/
  ui/                     ← shadcn primitives
  providers/              ← EmpreendimentoProvider, SessionProvider
  layout/                 ← Header, Sidebar, BottomNav, Switcher
  dashboard/ carteira/ prestacao/ extrato/ alertas/ configuracoes/
lib/
  prisma.ts auth.ts utils.ts
  conciliacao.ts          ← algoritmo de conciliação
  sicoob.ts               ← wrapper Open Finance
  excel-parser.ts         ← leitura planilhas Quality
  email.ts                ← templates Resend
  pdf-relatorio.tsx       ← PDF @react-pdf/renderer
  baixa-automatica.ts gerar-parcelas.ts empreendimento-ativo.ts
prisma/
  schema.prisma seed.ts
```

---

## 🧮 Algoritmo de conciliação

Implementado em `lib/conciliacao.ts`, executa 4 verificações:

1. **Valores** — soma créditos `REPASSE_QUALITY` no extrato vs `totalRecebidoQuality` da prestação (tolerância R$ 1,00) → `VALOR_DIFERENTE` · crítico
2. **Inadimplência** — cruza item a item; Quality diz inadimplente mas sistema recebeu, ou vice-versa → `INADIMPLENCIA_DIVERGENTE` · crítico
3. **Cobertura** — contrato ativo no sistema que não aparece na prestação → `LOTE_AUSENTE` · atenção. Inverso → `PARCELA_NAO_ENCONTRADA` · atenção
4. **Créditos sem origem** — transação Quality sem vínculo com item → `CREDITO_SEM_ORIGEM` · atenção

Ao final, `statusConciliacao = CONCILIADO_OK | CONCILIADO_DIVERGENCIAS` e cria alerta
`DIVERGENCIA_CONCILIACAO` para cada divergência crítica.

---

## ☁️ Deploy na Vercel + Supabase

1. Crie um projeto PostgreSQL no **Supabase** e copie a `DATABASE_URL`.
2. Faça push do repositório e importe na **Vercel**.
3. Configure as variáveis de ambiente (ver seção acima).
4. No primeiro deploy rode o migrate:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
5. Configure o domínio no Sicoob Developer (`SICOOB_REDIRECT_URI`).
6. Os crons de `vercel.json` são ativados automaticamente.

---

## 🧪 Scripts disponíveis

```bash
npm run dev              # Dev server
npm run build            # Build de produção
npm run start            # Start produção
npm run prisma:migrate   # Criar migration
npm run prisma:seed      # Popular dados exemplo
npm run prisma:studio    # Prisma Studio UI
```
