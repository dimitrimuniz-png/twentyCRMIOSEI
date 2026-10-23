export type TrainingCatalogModule = {
  order: number;
  fileName: string;
  title: string;
  description: string;
};

export type TrainingCatalogManual = {
  fileName: string;
  title: string;
};

export type TrainingCatalogDefinition = {
  manual: TrainingCatalogManual;
  modules: TrainingCatalogModule[];
};

export const DEFAULT_TRAINING_CATALOG: TrainingCatalogDefinition = {
  manual: {
    fileName: 'manual-crm-iosei.pdf',
    title: 'Manual do CRM IOSEI',
  },
  modules: [
    {
      order: 1,
      fileName: '01-visao-geral.mp4',
      title: 'Visão geral da tela e navegação',
      description:
        'Conhecer as partes da tela do CRM e saber chegar a qualquer lugar em poucos cliques.',
    },
    {
      order: 2,
      fileName: '02-organizacao.mp4',
      title: 'Como o CRM está organizado',
      description:
        'Entender a lógica: Empresas do grupo, Produtos e Oportunidades ligadas ao cliente.',
    },
    {
      order: 3,
      fileName: '03-produtos.mp4',
      title: 'Cadastrar e editar produtos',
      description:
        'Criar um produto novo ou corrigir um existente, sempre ligado à empresa do grupo certa.',
    },
    {
      order: 4,
      fileName: '04-empresa-pessoa.mp4',
      title: 'Cadastrar empresa (cliente) e pessoa (contato)',
      description:
        'Cadastrar um cliente novo e seus contatos, sem criar duplicados.',
    },
    {
      order: 5,
      fileName: '05-criar-oportunidade.mp4',
      title: 'Criar uma oportunidade',
      description:
        'Registrar uma venda em andamento com cliente, produto, valor, data e contato.',
    },
    {
      order: 6,
      fileName: '06-funil-kanban.mp4',
      title: 'Acompanhar e mover no funil',
      description:
        'Usar o Kanban para ver o andamento das vendas e mover cada oportunidade de fase.',
    },
    {
      order: 7,
      fileName: '07-tarefas-notas.mp4',
      title: 'Tarefas e notas na oportunidade',
      description:
        'Registrar o próximo passo e o que foi conversado dentro da oportunidade.',
    },
    {
      order: 8,
      fileName: '08-buscar-filtrar.mp4',
      title: 'Buscar, filtrar e salvar visualizações',
      description:
        'Encontrar o que precisa e guardar filtros como uma visualização.',
    },
    {
      order: 9,
      fileName: '09-boas-praticas.mp4',
      title: 'Boas práticas',
      description: 'Manter o CRM limpo e confiável para toda a equipe.',
    },
  ],
};
