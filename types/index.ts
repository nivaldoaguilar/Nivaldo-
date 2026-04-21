export type EmpreendimentoResumo = {
  id: string;
  nome: string;
  percentualSocio: number;
  cor: string;
  arquivado?: boolean;
};

export type DashboardMetricas = {
  aReceberMes: number;
  recebidoMes: number;
  inadimplente: number;
  minhaParte: number;
};
