import { PrismaClient, TipoPropriedade, StatusContrato, StatusParcela, TipoConta, TipoTransacao, CategoriaTransacao, StatusConciliacao, TipoDivergencia, Severidade, TipoAlerta } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function main() {
  console.log("Seeding database...");

  // Usuário admin
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@nivaldo.com.br" },
    update: {},
    create: {
      email: "admin@nivaldo.com.br",
      name: "Nivaldo Aguilar",
      passwordHash,
    },
  });

  // Configuração inicial
  await prisma.configuracao.upsert({
    where: { id: "config-default" },
    update: {},
    create: {
      id: "config-default",
      emailNotificacoes: "admin@nivaldo.com.br",
      diasToleranciaAtraso: 5,
    },
  });

  // Limpa dados antigos para re-seed idempotente
  await prisma.divergencia.deleteMany();
  await prisma.itemPrestacao.deleteMany();
  await prisma.prestacaoDeContas.deleteMany();
  await prisma.alerta.deleteMany();
  await prisma.parcela.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.lote.deleteMany();
  await prisma.transacao.deleteMany();
  await prisma.contaBancaria.deleteMany();
  await prisma.empreendimento.deleteMany();

  // Empreendimentos
  const scI = await prisma.empreendimento.create({
    data: {
      nome: "São Carlos I",
      percentualSocio: 36,
      cor: "#3b82f6",
      descricao: "Primeiro empreendimento do Alto de São Carlos",
    },
  });

  const scII = await prisma.empreendimento.create({
    data: {
      nome: "São Carlos II",
      percentualSocio: 50,
      cor: "#22c55e",
      descricao: "Segunda fase do loteamento",
    },
  });

  // Contas bancárias
  const contaPessoalI = await prisma.contaBancaria.create({
    data: {
      empreendimentoId: scI.id,
      apelido: "Pessoal Nivaldo",
      banco: "Sicoob",
      agencia: "3001",
      conta: "12345-6",
      tipoConta: TipoConta.CORRENTE,
    },
  });

  const contaEmpresaI = await prisma.contaBancaria.create({
    data: {
      empreendimentoId: scI.id,
      apelido: "Empresa São Carlos I",
      banco: "Sicoob",
      agencia: "3001",
      conta: "98765-4",
      tipoConta: TipoConta.CORRENTE,
    },
  });

  const contaPessoalII = await prisma.contaBancaria.create({
    data: {
      empreendimentoId: scII.id,
      apelido: "Pessoal Nivaldo II",
      banco: "Sicoob",
      agencia: "3001",
      conta: "22345-6",
      tipoConta: TipoConta.CORRENTE,
    },
  });

  const contaEmpresaII = await prisma.contaBancaria.create({
    data: {
      empreendimentoId: scII.id,
      apelido: "Empresa São Carlos II",
      banco: "Sicoob",
      agencia: "3001",
      conta: "88765-4",
      tipoConta: TipoConta.CORRENTE,
    },
  });

  // Lotes São Carlos I (5 societários + 3 pessoais)
  const lotesI = [
    { quadra: "A", numero: "01", tipo: TipoPropriedade.SOCIETARIO, comprador: "João da Silva", valor: 80000 },
    { quadra: "A", numero: "02", tipo: TipoPropriedade.SOCIETARIO, comprador: "Maria Oliveira", valor: 85000 },
    { quadra: "A", numero: "03", tipo: TipoPropriedade.SOCIETARIO, comprador: "Carlos Souza", valor: 75000 },
    { quadra: "B", numero: "01", tipo: TipoPropriedade.SOCIETARIO, comprador: "Ana Paula", valor: 90000 },
    { quadra: "B", numero: "02", tipo: TipoPropriedade.SOCIETARIO, comprador: "Roberto Lima", valor: 95000 },
    { quadra: "C", numero: "01", tipo: TipoPropriedade.PESSOAL, comprador: "Patrícia Mendes", valor: 100000 },
    { quadra: "C", numero: "02", tipo: TipoPropriedade.PESSOAL, comprador: "Fernando Costa", valor: 70000 },
    { quadra: "C", numero: "03", tipo: TipoPropriedade.PESSOAL, comprador: "Luciana Reis", valor: 82000 },
  ];

  // Lotes São Carlos II (4 societários)
  const lotesII = [
    { quadra: "D", numero: "01", tipo: TipoPropriedade.SOCIETARIO, comprador: "Paulo Rocha", valor: 65000 },
    { quadra: "D", numero: "02", tipo: TipoPropriedade.SOCIETARIO, comprador: "Juliana Alves", valor: 68000 },
    { quadra: "D", numero: "03", tipo: TipoPropriedade.SOCIETARIO, comprador: "Ricardo Martins", valor: 72000 },
    { quadra: "E", numero: "01", tipo: TipoPropriedade.SOCIETARIO, comprador: "Sandra Ferreira", valor: 60000 },
  ];

  const hoje = new Date();
  const assinatura = addMonths(hoje, -24);

  async function criarLoteComContrato(
    empreendimentoId: string,
    dados: (typeof lotesI)[0],
  ) {
    const lote = await prisma.lote.create({
      data: {
        empreendimentoId,
        quadra: dados.quadra,
        numero: dados.numero,
        identificacao: `Q${dados.quadra}-L${dados.numero}`,
        areaM2: 360 + Math.random() * 80,
        tipoPropriedade: dados.tipo,
      },
    });

    const totalParcelas = 120;
    const valorParcela = Number((dados.valor / totalParcelas).toFixed(2));
    const diaVencimento = 10;

    const contrato = await prisma.contrato.create({
      data: {
        loteId: lote.id,
        nomeComprador: dados.comprador,
        cpfComprador: "000.000.000-00",
        telefoneComprador: "(16) 99999-9999",
        emailComprador: `${dados.comprador.toLowerCase().replace(/\s/g, ".")}@exemplo.com`,
        valorTotal: dados.valor,
        valorEntrada: 0,
        dataAssinatura: assinatura,
        dataVencimento1Parcela: addMonths(assinatura, 1),
        quantidadeParcelas: totalParcelas,
        valorParcela,
        diaVencimento,
        status: StatusContrato.EM_DIA,
      },
    });

    // Criar parcelas (gera 24 meses de parcelas; primeiras 22 recebidas, últimas 2 pendentes)
    for (let i = 1; i <= 24; i++) {
      const vencimento = addMonths(assinatura, i);
      const jaVencida = vencimento < hoje;
      const recebida = i <= 22 && jaVencida;
      await prisma.parcela.create({
        data: {
          contratoId: contrato.id,
          numeroParcela: i,
          valorOriginal: valorParcela,
          dataVencimento: vencimento,
          status: recebida
            ? StatusParcela.RECEBIDA
            : jaVencida
              ? StatusParcela.ATRASADA
              : StatusParcela.PENDENTE,
          dataRecebimento: recebida ? vencimento : null,
          valorRecebido: recebida ? valorParcela : null,
        },
      });
    }

    return lote;
  }

  for (const l of lotesI) await criarLoteComContrato(scI.id, l);
  for (const l of lotesII) await criarLoteComContrato(scII.id, l);

  // Transações bancárias dos últimos 3 meses
  const contas = [contaPessoalI, contaEmpresaI, contaPessoalII, contaEmpresaII];
  for (const conta of contas) {
    for (let m = 0; m < 3; m++) {
      const data = addMonths(hoje, -m);
      data.setDate(7);
      await prisma.transacao.create({
        data: {
          contaBancariaId: conta.id,
          transacaoExternaId: `tx-${conta.id}-${m}-quality`,
          data,
          descricao: "TED QUALITY GESTAO IMOB - REPASSE MENSAL",
          valor: 25000 + Math.random() * 5000,
          tipo: TipoTransacao.CREDITO,
          categoria: CategoriaTransacao.REPASSE_QUALITY,
          identificadaComoRepasse: true,
        },
      });
      await prisma.transacao.create({
        data: {
          contaBancariaId: conta.id,
          transacaoExternaId: `tx-${conta.id}-${m}-outro`,
          data: new Date(data.getTime() + 86400000 * 3),
          descricao: "PAGAMENTO DE BOLETO - FORNECEDOR",
          valor: 1500,
          tipo: TipoTransacao.DEBITO,
          categoria: CategoriaTransacao.OUTROS,
          identificadaComoRepasse: false,
        },
      });
    }
  }

  // Prestação de contas março/2025 para cada empreendimento
  const mesPrestacao = 3;
  const anoPrestacao = 2025;

  for (const emp of [scI, scII]) {
    const prestacao = await prisma.prestacaoDeContas.create({
      data: {
        empreendimentoId: emp.id,
        mesReferencia: mesPrestacao,
        anoReferencia: anoPrestacao,
        dataEnvio: new Date(2025, 3, 5),
        arquivoNome: `prestacao-${emp.nome.toLowerCase().replace(/\s/g, "-")}-${mesPrestacao}-${anoPrestacao}.xlsx`,
        totalRecebidoQuality: 28500,
        totalRecebidoExtrato: 28500,
        statusConciliacao: StatusConciliacao.CONCILIADO_DIVERGENCIAS,
      },
    });

    // Itens
    const lotesEmp = await prisma.lote.findMany({
      where: { empreendimentoId: emp.id },
      include: { contrato: true },
    });

    for (const lote of lotesEmp.slice(0, 4)) {
      if (!lote.contrato) continue;
      await prisma.itemPrestacao.create({
        data: {
          prestacaoDeContasId: prestacao.id,
          loteIdentificacao: lote.identificacao,
          nomeComprador: lote.contrato.nomeComprador,
          valorRecebido: Number(lote.contrato.valorParcela),
          dataRecebimento: new Date(2025, 2, 10),
          numeroParcela: 23,
          statusReportado: "pago",
        },
      });
    }

    // Divergências exemplo
    await prisma.divergencia.create({
      data: {
        prestacaoDeContasId: prestacao.id,
        tipo: TipoDivergencia.INADIMPLENCIA_DIVERGENTE,
        severidade: Severidade.CRITICO,
        descricao: `Lote ${lotesEmp[0].identificacao}: Quality reportou como pago, mas há parcela atrasada no sistema`,
        loteIdentificacao: lotesEmp[0].identificacao,
        valorEsperado: 700,
        valorEncontrado: 0,
      },
    });

    await prisma.divergencia.create({
      data: {
        prestacaoDeContasId: prestacao.id,
        tipo: TipoDivergencia.LOTE_AUSENTE,
        severidade: Severidade.ATENCAO,
        descricao: `Lote ${lotesEmp[lotesEmp.length - 1].identificacao} ativo no sistema não aparece na prestação da Quality`,
        loteIdentificacao: lotesEmp[lotesEmp.length - 1].identificacao,
      },
    });
  }

  // Alertas
  await prisma.alerta.createMany({
    data: [
      {
        tipo: TipoAlerta.DIVERGENCIA_CONCILIACAO,
        titulo: "Divergência crítica detectada",
        mensagem: "Inadimplência divergente no lote QA-L01 da prestação de março/2025",
        lido: false,
      },
      {
        tipo: TipoAlerta.PARCELA_VENCIDA,
        titulo: "Parcela vencida há mais de 5 dias",
        mensagem: "Lote QC-L02 com parcela 23 em atraso",
        lido: false,
      },
      {
        tipo: TipoAlerta.REPASSE_RECEBIDO,
        titulo: "Repasse Quality recebido",
        mensagem: "Crédito de R$ 28.500,00 identificado no extrato da Empresa São Carlos I",
        lido: true,
      },
      {
        tipo: TipoAlerta.INADIMPLENCIA_NOVA,
        titulo: "Novo contrato inadimplente",
        mensagem: "Lote QB-L01 mudou para status inadimplente",
        lido: true,
      },
    ],
  });

  console.log("Seed concluído com sucesso!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
