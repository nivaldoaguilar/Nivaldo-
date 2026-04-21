import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Divergencia, ItemPrestacao, PrestacaoDeContas, Empreendimento } from "@prisma/client";
import React from "react";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  titulo: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },
  subtitulo: { fontSize: 12, color: "#666", marginBottom: 18 },
  secao: { marginBottom: 14 },
  secaoTitulo: { fontSize: 12, fontWeight: "bold", marginBottom: 6, paddingBottom: 2, borderBottom: "1px solid #ccc" },
  row: { flexDirection: "row", paddingVertical: 3, borderBottom: "0.5px solid #eee" },
  cellLabel: { width: "28%", color: "#555" },
  cellValue: { flex: 1 },
  divItem: { marginBottom: 8, paddingBottom: 6, borderBottom: "0.5px solid #ddd" },
  badge: { fontSize: 9, fontWeight: "bold" },
  critico: { color: "#dc2626" },
  atencao: { color: "#d97706" },
  info: { color: "#2563eb" },
});

type DadosRelatorio = {
  prestacao: PrestacaoDeContas & {
    empreendimento: Empreendimento;
    itens: ItemPrestacao[];
    divergencias: Divergencia[];
  };
};

function formatBRL(v: unknown): string {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function RelatorioConciliacaoPDF({ prestacao }: DadosRelatorio) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>Relatório de Conciliação Quality</Text>
        <Text style={styles.subtitulo}>
          {prestacao.empreendimento.nome} · {String(prestacao.mesReferencia).padStart(2, "0")}/
          {prestacao.anoReferencia}
        </Text>

        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Resumo</Text>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Total Quality</Text>
            <Text style={styles.cellValue}>{formatBRL(prestacao.totalRecebidoQuality)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Total Extrato</Text>
            <Text style={styles.cellValue}>{formatBRL(prestacao.totalRecebidoExtrato)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Status</Text>
            <Text style={styles.cellValue}>{prestacao.statusConciliacao.replace(/_/g, " ")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Itens importados</Text>
            <Text style={styles.cellValue}>{prestacao.itens.length}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellLabel}>Divergências</Text>
            <Text style={styles.cellValue}>{prestacao.divergencias.length}</Text>
          </View>
        </View>

        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Divergências ({prestacao.divergencias.length})</Text>
          {prestacao.divergencias.length === 0 ? (
            <Text>Nenhuma divergência encontrada.</Text>
          ) : (
            prestacao.divergencias.map((d) => (
              <View key={d.id} style={styles.divItem}>
                <Text
                  style={[
                    styles.badge,
                    d.severidade === "CRITICO"
                      ? styles.critico
                      : d.severidade === "ATENCAO"
                        ? styles.atencao
                        : styles.info,
                  ]}
                >
                  [{d.severidade}] {d.tipo.replace(/_/g, " ")}
                </Text>
                <Text>{d.descricao}</Text>
                {d.loteIdentificacao && <Text>Lote: {d.loteIdentificacao}</Text>}
                {d.valorEsperado != null && (
                  <Text>
                    Esperado: {formatBRL(d.valorEsperado)}
                    {d.valorEncontrado != null && ` · Encontrado: ${formatBRL(d.valorEncontrado)}`}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );
}
