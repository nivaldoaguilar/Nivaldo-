#!/usr/bin/env node
// Script de setup automatizado: roda migração no Supabase e força redeploy no Vercel.
// Uso: node setup-deploy.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SUPABASE_TOKEN = process.env.SUPABASE_TOKEN;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "xhmjgkuzlsosbqdlveza";

if (!SUPABASE_TOKEN || !VERCEL_TOKEN) {
  console.error("Defina SUPABASE_TOKEN e VERCEL_TOKEN como variáveis de ambiente.");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "supabase-migration.sql");
const sql = readFileSync(sqlPath, "utf8");

const log = (msg) => console.log(`\x1b[36m[setup]\x1b[0m ${msg}`);
const ok = (msg) => console.log(`\x1b[32m[ok]\x1b[0m ${msg}`);
const err = (msg) => console.error(`\x1b[31m[erro]\x1b[0m ${msg}`);

async function runSupabaseMigration() {
  log("Rodando SQL no Supabase via Management API...");
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  const text = await res.text();
  if (!res.ok) {
    err(`Supabase respondeu ${res.status}: ${text}`);
    process.exit(1);
  }
  ok("Migração executada — todas as tabelas criadas no Supabase.");
  return JSON.parse(text);
}

async function vercel(path, init = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Vercel ${res.status} em ${path}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function findVercelProject() {
  log("Buscando projeto no Vercel...");
  const data = await vercel("/v9/projects?limit=100");
  const project = data.projects.find((p) =>
    p.name.toLowerCase().includes("nivaldo")
  );
  if (!project) {
    err("Projeto contendo 'nivaldo' não encontrado. Projetos disponíveis:");
    data.projects.forEach((p) => console.log(`  - ${p.name} (${p.id})`));
    process.exit(1);
  }
  ok(`Projeto encontrado: ${project.name} (${project.id})`);
  return project;
}

async function ensureEnvVars(projectId) {
  log("Verificando variáveis de ambiente do Vercel...");
  const data = await vercel(`/v9/projects/${projectId}/env?decrypt=true`);
  const existing = new Map(data.envs.map((e) => [e.key, e]));

  const required = {
    DATABASE_URL: `postgresql://postgres.${SUPABASE_PROJECT_REF}:[SUA_SENHA_DO_DB]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
  };

  const missing = [];
  for (const key of Object.keys(required)) {
    if (!existing.has(key)) missing.push(key);
  }

  if (existing.has("DATABASE_URL")) {
    ok("DATABASE_URL já está configurada no Vercel.");
  } else {
    err("DATABASE_URL NÃO está no Vercel — precisa ser adicionada manualmente:");
    err("Vá em vercel.com/dashboard > seu projeto > Settings > Environment Variables");
    err(`Use: ${required.DATABASE_URL}`);
  }

  if (!existing.has("NEXTAUTH_SECRET")) {
    err("NEXTAUTH_SECRET faltando — gere com: openssl rand -base64 32");
  } else {
    ok("NEXTAUTH_SECRET configurada.");
  }

  if (!existing.has("NEXTAUTH_URL")) {
    err("NEXTAUTH_URL faltando — defina como https://nivaldo.vercel.app");
  } else {
    ok("NEXTAUTH_URL configurada.");
  }

  return missing;
}

async function triggerRedeploy(projectId, projectName) {
  log("Disparando novo deploy no Vercel...");
  // Pega o último deploy de produção para reaproveitar a referência git
  const deploys = await vercel(
    `/v6/deployments?projectId=${projectId}&limit=1&target=production`
  );
  const last = deploys.deployments?.[0];
  if (!last) {
    err("Nenhum deploy anterior encontrado — faça um git push para acionar.");
    return;
  }

  const body = {
    name: projectName,
    target: "production",
    gitSource: {
      type: "github",
      ref: last.meta?.githubCommitRef || "main",
      repoId: last.meta?.githubRepoId,
    },
  };

  const result = await vercel("/v13/deployments", {
    method: "POST",
    body: JSON.stringify(body),
  });
  ok(`Deploy iniciado: https://${result.url}`);
  ok("Acompanhe em: https://vercel.com/dashboard");
}

(async () => {
  try {
    await runSupabaseMigration();
    const project = await findVercelProject();
    await ensureEnvVars(project.id);
    await triggerRedeploy(project.id, project.name);
    console.log("\n\x1b[32m✓ Setup concluído!\x1b[0m");
    console.log("Aguarde 1-2 minutos para o deploy finalizar, depois acesse:");
    console.log("https://nivaldo.vercel.app/login");
  } catch (e) {
    err(e.message);
    process.exit(1);
  }
})();
