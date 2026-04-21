import { StatusParcela } from "@prisma/client";

export type ParcelaGerada = {
  numeroParcela: number;
  valorOriginal: number;
  dataVencimento: Date;
  status: StatusParcela;
};

export function gerarParcelas(params: {
  quantidadeParcelas: number;
  valorParcela: number;
  dataVencimento1Parcela: Date;
  diaVencimento: number;
}): ParcelaGerada[] {
  const parcelas: ParcelaGerada[] = [];
  const { quantidadeParcelas, valorParcela, dataVencimento1Parcela, diaVencimento } = params;

  for (let i = 0; i < quantidadeParcelas; i++) {
    const data = new Date(dataVencimento1Parcela);
    data.setMonth(data.getMonth() + i);
    data.setDate(diaVencimento);

    parcelas.push({
      numeroParcela: i + 1,
      valorOriginal: valorParcela,
      dataVencimento: data,
      status: StatusParcela.PENDENTE,
    });
  }
  return parcelas;
}
