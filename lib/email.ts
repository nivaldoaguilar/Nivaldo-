import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "gestao@altodesaocarlos.com.br";

async function enviar(to: string, subject: string, html: string, anexos?: { filename: string; content: Buffer }[]) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY não configurada, e-mail não enviado:", subject);
    return { skipped: true };
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    attachments: anexos?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });

  if (error) {
    console.error("[email] erro ao enviar:", error);
    throw error;
  }
  return data;
}

export function emailParcelaVencida(
  to: string,
  dados: { loteIdentificacao: string; comprador: string; numeroParcela: number; diasAtraso: number; valor: string },
) {
  return enviar(
    to,
    `[Carteira] Parcela vencida - ${dados.loteIdentificacao}`,
    `
      <h2>Parcela vencida há ${dados.diasAtraso} dias</h2>
      <p><strong>Lote:</strong> ${dados.loteIdentificacao}</p>
      <p><strong>Comprador:</strong> ${dados.comprador}</p>
      <p><strong>Parcela:</strong> ${dados.numeroParcela}</p>
      <p><strong>Valor:</strong> ${dados.valor}</p>
      <hr />
      <p>Acesse o sistema para mais detalhes.</p>
    `,
  );
}

export function emailRelatorioDivergencias(
  to: string,
  dados: {
    mesReferencia: string;
    empreendimento: string;
    totalDivergencias: number;
    criticas: number;
    pdfBuffer?: Buffer;
  },
) {
  return enviar(
    to,
    `[Carteira] Relatório de conciliação - ${dados.empreendimento} - ${dados.mesReferencia}`,
    `
      <h2>Relatório de conciliação disponível</h2>
      <p><strong>Empreendimento:</strong> ${dados.empreendimento}</p>
      <p><strong>Referência:</strong> ${dados.mesReferencia}</p>
      <p><strong>Total de divergências:</strong> ${dados.totalDivergencias}</p>
      <p><strong>Críticas:</strong> ${dados.criticas}</p>
      <hr />
      <p>Relatório completo em anexo.</p>
    `,
    dados.pdfBuffer
      ? [{ filename: `conciliacao-${dados.mesReferencia}.pdf`, content: dados.pdfBuffer }]
      : undefined,
  );
}

export function emailRepasseRecebido(
  to: string,
  dados: { conta: string; valor: string; data: string },
) {
  return enviar(
    to,
    "[Carteira] Repasse Quality recebido",
    `
      <h2>Repasse Quality identificado no extrato</h2>
      <p><strong>Conta:</strong> ${dados.conta}</p>
      <p><strong>Valor:</strong> ${dados.valor}</p>
      <p><strong>Data:</strong> ${dados.data}</p>
    `,
  );
}
