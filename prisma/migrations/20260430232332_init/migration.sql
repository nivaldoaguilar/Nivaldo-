-- CreateEnum
CREATE TYPE "TipoPropriedade" AS ENUM ('SOCIETARIO', 'PESSOAL');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('EM_DIA', 'INADIMPLENTE', 'QUITADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusParcela" AS ENUM ('PENDENTE', 'RECEBIDA', 'ATRASADA', 'BAIXA_AUTOMATICA', 'BAIXA_MANUAL');

-- CreateEnum
CREATE TYPE "TipoConta" AS ENUM ('CORRENTE', 'POUPANCA');

-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('CREDITO', 'DEBITO');

-- CreateEnum
CREATE TYPE "CategoriaTransacao" AS ENUM ('REPASSE_QUALITY', 'OUTROS');

-- CreateEnum
CREATE TYPE "StatusConciliacao" AS ENUM ('PENDENTE', 'CONCILIADO_OK', 'CONCILIADO_DIVERGENCIAS', 'EM_ANALISE');

-- CreateEnum
CREATE TYPE "TipoDivergencia" AS ENUM ('VALOR_DIFERENTE', 'PARCELA_NAO_ENCONTRADA', 'LOTE_AUSENTE', 'INADIMPLENCIA_DIVERGENTE', 'CREDITO_SEM_ORIGEM');

-- CreateEnum
CREATE TYPE "Severidade" AS ENUM ('CRITICO', 'ATENCAO', 'INFO');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('PARCELA_VENCIDA', 'INADIMPLENCIA_NOVA', 'DIVERGENCIA_CONCILIACAO', 'REPASSE_RECEBIDO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empreendimentos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "percentualSocio" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT,
    "cor" TEXT NOT NULL DEFAULT '#3b82f6',
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empreendimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" TEXT NOT NULL,
    "empreendimentoId" TEXT NOT NULL,
    "quadra" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "identificacao" TEXT NOT NULL,
    "areaM2" DOUBLE PRECISION,
    "tipoPropriedade" "TipoPropriedade" NOT NULL DEFAULT 'SOCIETARIO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "nomeComprador" TEXT NOT NULL,
    "cpfComprador" TEXT,
    "telefoneComprador" TEXT,
    "emailComprador" TEXT,
    "valorTotal" DECIMAL(12,2) NOT NULL,
    "valorEntrada" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "dataAssinatura" TIMESTAMP(3) NOT NULL,
    "dataVencimento1Parcela" TIMESTAMP(3) NOT NULL,
    "quantidadeParcelas" INTEGER NOT NULL,
    "valorParcela" DECIMAL(12,2) NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "status" "StatusContrato" NOT NULL DEFAULT 'EM_DIA',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcelas" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "numeroParcela" INTEGER NOT NULL,
    "valorOriginal" DECIMAL(12,2) NOT NULL,
    "valorCorrigido" DECIMAL(12,2),
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataRecebimento" TIMESTAMP(3),
    "valorRecebido" DECIMAL(12,2),
    "status" "StatusParcela" NOT NULL DEFAULT 'PENDENTE',
    "transacaoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_bancarias" (
    "id" TEXT NOT NULL,
    "empreendimentoId" TEXT,
    "apelido" TEXT NOT NULL,
    "banco" TEXT NOT NULL DEFAULT 'Sicoob',
    "agencia" TEXT NOT NULL,
    "conta" TEXT NOT NULL,
    "tipoConta" "TipoConta" NOT NULL DEFAULT 'CORRENTE',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "consentimentoId" TEXT,
    "ultimaSincronizacao" TIMESTAMP(3),
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacoes" (
    "id" TEXT NOT NULL,
    "contaBancariaId" TEXT NOT NULL,
    "transacaoExternaId" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "tipo" "TipoTransacao" NOT NULL,
    "categoria" "CategoriaTransacao" NOT NULL DEFAULT 'OUTROS',
    "identificadaComoRepasse" BOOLEAN NOT NULL DEFAULT false,
    "prestacaoDeContasId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestacoes_de_contas" (
    "id" TEXT NOT NULL,
    "empreendimentoId" TEXT NOT NULL,
    "mesReferencia" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "dataEnvio" TIMESTAMP(3) NOT NULL,
    "dataImportacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arquivoNome" TEXT NOT NULL,
    "arquivoUrl" TEXT,
    "totalRecebidoQuality" DECIMAL(12,2) NOT NULL,
    "totalRecebidoExtrato" DECIMAL(12,2),
    "statusConciliacao" "StatusConciliacao" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prestacoes_de_contas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_prestacao" (
    "id" TEXT NOT NULL,
    "prestacaoDeContasId" TEXT NOT NULL,
    "loteIdentificacao" TEXT NOT NULL,
    "nomeComprador" TEXT,
    "valorRecebido" DECIMAL(12,2) NOT NULL,
    "dataRecebimento" TIMESTAMP(3) NOT NULL,
    "numeroParcela" INTEGER,
    "statusReportado" TEXT,
    "parcelaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itens_prestacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divergencias" (
    "id" TEXT NOT NULL,
    "prestacaoDeContasId" TEXT NOT NULL,
    "tipo" "TipoDivergencia" NOT NULL,
    "severidade" "Severidade" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorEsperado" DECIMAL(12,2),
    "valorEncontrado" DECIMAL(12,2),
    "loteIdentificacao" TEXT,
    "resolucao" TEXT,
    "resolvida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divergencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAlerta" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "loteId" TEXT,
    "parcelaId" TEXT,
    "emailEnviado" BOOLEAN NOT NULL DEFAULT false,
    "emailEnviadoEm" TIMESTAMP(3),
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL,
    "emailNotificacoes" TEXT NOT NULL,
    "diasToleranciaAtraso" INTEGER NOT NULL DEFAULT 5,
    "sicoobClientId" TEXT,
    "sicoobClientSecret" TEXT,
    "sicoobRedirectUri" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_empreendimentoId_quadra_numero_key" ON "lotes"("empreendimentoId", "quadra", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_loteId_key" ON "contratos"("loteId");

-- CreateIndex
CREATE UNIQUE INDEX "parcelas_contratoId_numeroParcela_key" ON "parcelas"("contratoId", "numeroParcela");

-- CreateIndex
CREATE UNIQUE INDEX "transacoes_contaBancariaId_transacaoExternaId_key" ON "transacoes"("contaBancariaId", "transacaoExternaId");

-- CreateIndex
CREATE UNIQUE INDEX "prestacoes_de_contas_empreendimentoId_mesReferencia_anoRefe_key" ON "prestacoes_de_contas"("empreendimentoId", "mesReferencia", "anoReferencia");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_empreendimentoId_fkey" FOREIGN KEY ("empreendimentoId") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcelas" ADD CONSTRAINT "parcelas_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcelas" ADD CONSTRAINT "parcelas_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_bancarias" ADD CONSTRAINT "contas_bancarias_empreendimentoId_fkey" FOREIGN KEY ("empreendimentoId") REFERENCES "empreendimentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_contaBancariaId_fkey" FOREIGN KEY ("contaBancariaId") REFERENCES "contas_bancarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_prestacaoDeContasId_fkey" FOREIGN KEY ("prestacaoDeContasId") REFERENCES "prestacoes_de_contas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestacoes_de_contas" ADD CONSTRAINT "prestacoes_de_contas_empreendimentoId_fkey" FOREIGN KEY ("empreendimentoId") REFERENCES "empreendimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_prestacao" ADD CONSTRAINT "itens_prestacao_prestacaoDeContasId_fkey" FOREIGN KEY ("prestacaoDeContasId") REFERENCES "prestacoes_de_contas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divergencias" ADD CONSTRAINT "divergencias_prestacaoDeContasId_fkey" FOREIGN KEY ("prestacaoDeContasId") REFERENCES "prestacoes_de_contas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
