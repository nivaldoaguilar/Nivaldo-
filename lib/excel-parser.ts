import * as XLSX from "xlsx";

export type ItemPrestacaoImportado = {
  loteIdentificacao: string;
  nomeComprador: string | null;
  valorRecebido: number;
  dataRecebimento: Date;
  numeroParcela: number | null;
  statusReportado: string | null;
};

const ALIAS_LOTE = ["lote", "identificacao", "identificação", "unidade", "quadra/lote"];
const ALIAS_COMPRADOR = ["comprador", "cliente", "nome", "adquirente"];
const ALIAS_VALOR = ["valor", "valor_recebido", "recebido", "pago", "total"];
const ALIAS_DATA = ["data", "data_recebimento", "data_pagamento", "vencimento"];
const ALIAS_PARCELA = ["parcela", "numero_parcela", "nº parcela", "n_parcela"];
const ALIAS_STATUS = ["status", "situacao", "situação"];

function normalizar(texto: string): string {
  return texto
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function encontrarColuna(cabecalho: string[], aliases: string[]): number {
  for (let i = 0; i < cabecalho.length; i++) {
    const n = normalizar(cabecalho[i]);
    if (aliases.some((a) => n.includes(normalizar(a)))) return i;
  }
  return -1;
}

function parsearData(valor: unknown): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) return valor;

  if (typeof valor === "number") {
    const utcDays = Math.floor(valor - 25569);
    const utcValue = utcDays * 86400;
    return new Date(utcValue * 1000);
  }

  const str = String(valor).trim();
  const brMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (brMatch) {
    const [, dia, mes, anoRaw] = brMatch;
    const ano = anoRaw.length === 2 ? 2000 + parseInt(anoRaw, 10) : parseInt(anoRaw, 10);
    return new Date(ano, parseInt(mes, 10) - 1, parseInt(dia, 10));
  }

  const iso = new Date(str);
  return isNaN(iso.getTime()) ? null : iso;
}

function parsearNumero(valor: unknown): number {
  if (typeof valor === "number") return valor;
  if (!valor) return 0;
  const str = String(valor)
    .replace(/[R$\s]/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = parseFloat(str);
  return Number.isNaN(num) ? 0 : num;
}

export function parsearPlanilhaQuality(buffer: Buffer): {
  itens: ItemPrestacaoImportado[];
  total: number;
  erros: string[];
} {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true });

  if (!rows.length) {
    return { itens: [], total: 0, erros: ["Planilha vazia"] };
  }

  // Detectar linha de cabeçalho (primeira linha com "lote" ou similares)
  let linhaCabecalho = 0;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = (rows[i] ?? []).map((c) => String(c ?? ""));
    if (row.some((c) => ALIAS_LOTE.some((a) => normalizar(c).includes(normalizar(a))))) {
      linhaCabecalho = i;
      break;
    }
  }

  const cabecalho = (rows[linhaCabecalho] ?? []).map((c) => String(c ?? ""));
  const idxLote = encontrarColuna(cabecalho, ALIAS_LOTE);
  const idxComprador = encontrarColuna(cabecalho, ALIAS_COMPRADOR);
  const idxValor = encontrarColuna(cabecalho, ALIAS_VALOR);
  const idxData = encontrarColuna(cabecalho, ALIAS_DATA);
  const idxParcela = encontrarColuna(cabecalho, ALIAS_PARCELA);
  const idxStatus = encontrarColuna(cabecalho, ALIAS_STATUS);

  const erros: string[] = [];
  if (idxLote === -1) erros.push("Coluna 'Lote' não encontrada");
  if (idxValor === -1) erros.push("Coluna 'Valor' não encontrada");
  if (idxData === -1) erros.push("Coluna 'Data' não encontrada");

  if (erros.length) return { itens: [], total: 0, erros };

  const itens: ItemPrestacaoImportado[] = [];
  let total = 0;

  for (let i = linhaCabecalho + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.length) continue;
    const loteVal = row[idxLote];
    if (!loteVal) continue;

    const valor = parsearNumero(row[idxValor]);
    if (valor === 0) continue;

    const data = parsearData(row[idxData]);
    if (!data) {
      erros.push(`Linha ${i + 1}: data inválida`);
      continue;
    }

    const parcelaVal = idxParcela !== -1 ? row[idxParcela] : null;
    const statusVal = idxStatus !== -1 ? row[idxStatus] : null;
    const compradorVal = idxComprador !== -1 ? row[idxComprador] : null;

    itens.push({
      loteIdentificacao: String(loteVal).trim(),
      nomeComprador: compradorVal ? String(compradorVal).trim() : null,
      valorRecebido: valor,
      dataRecebimento: data,
      numeroParcela: parcelaVal ? parseInt(String(parcelaVal), 10) : null,
      statusReportado: statusVal ? String(statusVal).trim() : null,
    });
    total += valor;
  }

  return { itens, total, erros };
}
