/**
 * ============================================================================
 *  CONTEÚDO EDITÁVEL — único arquivo que você precisa editar para personalizar
 * ============================================================================
 *  Todo texto visível vem daqui. Itens ainda marcados com {{PLACEHOLDER}}
 *  aguardam informação. Links que forem placeholders viram "#" sozinhos.
 */

export const site = {
  nome: "Matheus Ryan",
  headline: "Java Developer in Training | POO • Spring Boot • SQL",
  bio: "Estudante de Desenvolvimento de Sistemas e Engenharia de Software. Membro da Diretoria de Projetos da LAMIT. Apaixonado por IA e por tudo que ela pode facilitar na nossa vida.",
  email: "matheusryanprof@gmail.com",
  linkedin: "https://www.linkedin.com/in/matheus-ryan-santos",
  github: "https://github.com/MatheusRyans",
  hintPerfilTecnico: "ir para o Perfil Técnico",
  dragHint: "Arraste para interagir",
} as const;

export type Feature = {
  index: string;
  label: string;
  title: string;
  text: string;
};

export type Project = {
  slug: string;
  navLabel: string;
  /** Linhas do título do hero. A ÚLTIMA linha é renderizada em itálico dourado. */
  titleLines: string[];
  description: string;
  cta: string;
  ctaHref: string;
  /** Link do repositório (botão secundário do hero). */
  repoHref?: string;
  /** Print do projeto (arquivo em /public/projects). */
  image: { src: string; w: number; h: number; alt: string };
  featuresEyebrow: string;
  features: Feature[];
  about: {
    eyebrow: string;
    text: string;
    blocks: { title: string; text: string }[];
  };
  closing: { company: string; lines: string[]; cta: string };
};

export const projects: Project[] = [
  {
    slug: "synapse",
    navLabel: "Synapse",
    titleLines: ["Saúde mental", "no ambiente", "corporativo."],
    description:
      "Plano de saúde mental para empresas: cada funcionário tem 1 sessão por semana com um psicólogo fixo. Escolhida a melhor solução industrial do Power Tech Hackathon 2026, do SENAI CIMATEC.",
    cta: "Ver o projeto",
    ctaHref: "https://synapse-sooty-delta.vercel.app/",
    repoHref: "https://github.com/Aquinozz/Synapse",
    image: { src: "/projects/synapse.webp", w: 1100, h: 727, alt: "Página inicial do Synapse: \"Terapia toda semana para o seu time\" e cartão da sessão semanal" },
    featuresEyebrow: "Funcionalidades",
    features: [
      {
        index: "01",
        label: "Funcionário",
        title: "Sessão semanal com psicólogo fixo",
        text: "Escolhe ou troca psicólogo e horário, remarca a sessão da semana, faz o check-in diário e acompanha o próprio bem-estar.",
      },
      {
        index: "02",
        label: "Psicólogo",
        title: "Agenda, pacientes e evolução",
        text: "Define os horários, dá nota e comentário a cada sessão e acompanha o gráfico de evolução. Recebe um alerta quando um check-in chega muito baixo.",
      },
      {
        index: "03",
        label: "Acessibilidade",
        title: "Feito para todas as pessoas",
        text: "Tamanho de letra ajustável, leitura em voz alta e filtros de cor para protanopia, deuteranopia e tritanopia.",
      },
    ],
    about: {
      eyebrow: "Power Tech Hackathon 2026 · SENAI CIMATEC",
      text: "Solução criada em equipe para uma necessidade do SENAI SP: tornar o acesso à saúde mental mais simples e acessível no ambiente corporativo. Foi escolhida como a melhor solução industrial do hackathon.",
      blocks: [
        {
          title: "O desafio",
          text: "Ampliar o acesso à saúde mental nas empresas com um modelo simples de contratar e de usar.",
        },
        {
          title: "O modelo",
          text: "A empresa paga R$ 200 por funcionário ao mês. O psicólogo não paga para estar na plataforma e recebe R$ 50 por sessão realizada.",
        },
        {
          title: "Tecnologia",
          text: "Front end em React 19, Vite, Tailwind CSS v4 e React Router. API em Express com Postgres, 35 testes automatizados e deploy na Vercel.",
        },
        {
          title: "Privacidade",
          text: "Termo de aceite com consentimento para dados de saúde (LGPD), registrado pela API. A foto do funcionário não é visível para a empresa.",
        },
      ],
    },
    closing: {
      company: "SENAI CIMATEC",
      lines: ["Melhor solução", "industrial."],
      cta: "Abrir a demo",
    },
  },
  {
    slug: "getrin",
    navLabel: "Getrin",
    titleLines: ["Treinamentos", "industriais sem", "planilhas."],
    description:
      "Sistema web de gestão e monitoramento de treinamentos para pequenas e médias indústrias, com foco em conformidade com as Normas Regulamentadoras (NRs). TCC do SENAI CIMATEC, 2026.",
    cta: "Acessar o sistema",
    ctaHref: "https://getrin.vercel.app/html/login.html",
    repoHref: "https://github.com/diegojbcunha/getrin",
    image: { src: "/projects/getrin.webp", w: 1100, h: 518, alt: "Tela de login do Getrin com perfis Admin, Gestor e Trabalhador" },
    featuresEyebrow: "Funcionalidades",
    features: [
      {
        index: "01",
        label: "Gestor",
        title: "Conformidade em tempo real",
        text: "Dashboard de indicadores, atribuição de treinamentos por cargo e função, alertas de vencimento 30 e 7 dias antes e relatório exportável para auditoria.",
      },
      {
        index: "02",
        label: "Colaborador",
        title: "Portal pessoal de treinamentos",
        text: "Treinamentos pendentes e concluídos, execução pela plataforma, certificado digital emitido ao concluir e acesso offline com sincronização.",
      },
      {
        index: "03",
        label: "Modelo híbrido",
        title: "Seu conteúdo ou a biblioteca por NR",
        text: "A empresa sobe manuais, vídeos e procedimentos internos, usa treinamentos prontos por NR (NR-10, NR-12, NR-35…) ou os dois ao mesmo tempo.",
      },
    ],
    about: {
      eyebrow: "TCC · SENAI CIMATEC · Backend e testes",
      text: "Trabalho de Conclusão de Curso de Desenvolvimento de Sistemas, feito em equipe de cinco pessoas. Minha atuação foi em desenvolvimento backend e testes.",
      blocks: [
        {
          title: "O problema",
          text: "47% das empresas brasileiras ainda controlam treinamentos obrigatórios em planilhas manuais, sem alertas de vencimento nem rastreabilidade (Valor Econômico, 2026).",
        },
        {
          title: "A solução",
          text: "Centraliza o cadastro de treinamentos, a validade por norma, o status de cada colaborador e um relatório pronto para comprovação em fiscalização.",
        },
        {
          title: "Dados e segurança",
          text: "PostgreSQL no Supabase com Supabase Auth e Row Level Security: os dados de uma empresa ficam isolados dos de outra. Log de auditoria das ações críticas.",
        },
        {
          title: "Perfis de acesso",
          text: "Administrador, gestor e colaborador, cada um com permissões próprias. Front end em HTML, CSS e JavaScript.",
        },
      ],
    },
    closing: {
      company: "SENAI CIMATEC",
      lines: ["Conformidade que", "se comprova."],
      cta: "Acessar o sistema",
    },
  },
  {
    slug: "aineedhealth",
    navLabel: "AIneedHealth",
    titleLines: ["Saúde da", "tripulação em", "órbita."],
    description:
      "Protótipo de autoavaliação de saúde para astronautas, criado no hackathon NASA Space Apps 2026, onde liderei a equipe. Compara cada valor com a linha de base da pessoa e com limites de segurança, e não faz diagnóstico. Dados simulados.",
    cta: "Ver a demo",
    ctaHref: "https://aineedhealth.vercel.app/",
    repoHref: "https://github.com/MatheusRyans/Nasa-Space-Apps-2026",
    image: { src: "/projects/aineedhealth.webp", w: 1100, h: 741, alt: "AIneedHealth: painel do astronauta com alerta de fadiga e mapa corporal holográfico" },
    featuresEyebrow: "Funcionalidades",
    features: [
      {
        index: "01",
        label: "Check-in",
        title: "Compara com a própria linha de base",
        text: "O astronauta faz o check-in e o sistema explica o resultado, diz o que fazer e quando acionar a equipe médica de voo.",
      },
      {
        index: "02",
        label: "4 níveis",
        title: "Bom, alerta, atenção, emergência",
        text: "Rota A: desvio persistente da linha de base, com histerese. Rota B: limites absolutos confirmados por duas leituras. Padrões combinados indicam fadiga ou exposição a poeira após uma EVA.",
      },
      {
        index: "03",
        label: "Emergência",
        title: "Detecção por fluxo de sensores",
        text: "Incapacitação detectada a partir de um fluxo simulado (frequência cardíaca, movimento, qualidade do sinal), com etapa de verificação. Sono e perda de sensor não disparam alarme sozinhos.",
      },
    ],
    about: {
      eyebrow: "NASA Space Apps 2026 · Líder da equipe",
      text: "Hackathon da NASA em que liderei a equipe. Protótipo para o desafio \"Create Health Monitoring Software for Astronauts on Space Missions\". Todos os dados do repositório são simulados.",
      blocks: [
        {
          title: "Engenharia",
          text: "Motor de classificação puro, separado da interface, com 13 testes automatizados, incluindo a medição de falsos alarmes em dados saudáveis aleatórios.",
        },
        {
          title: "Interface",
          text: "Mapa corporal holográfico, painéis de vidro, controles de demonstração e inglês com alternância para português. Build em um único HTML.",
        },
        {
          title: "Parâmetros",
          text: "Cada limiar é um parâmetro do Perfil Médico, definido pela equipe médica de voo. Os valores do protótipo são de demonstração.",
        },
        {
          title: "Limites assumidos",
          text: "Os limiares não são valores da NASA nem foram validados clinicamente. A NASA-STD-3001 Vol. 1 não define limites numéricos de sinais vitais.",
        },
      ],
    },
    closing: {
      company: "NASA Space Apps 2026",
      lines: ["Saúde em órbita,", "explicada."],
      cta: "Abrir a demo",
    },
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** Perfil técnico — painel estilo terminal. */
export const profile = {
  handle: "matheusryans",
  indexName: "matheus-ryan-index",
  role: "Java Developer in Training",
  stats: {
    from: "Salvador, BA · Brasil",
    currentlyIn: "LAMIT",
    contributions: "149 no último ano",
    email: "matheusryanprof@gmail.com",
  },
  stack: [
    "Java | Spring",
    "JS & TS | Node.js",
    "HTML | CSS | Angular",
    "MySQL | Supabase",
    "AWS | Git & GitHub",
  ],
  /** Painel "english": defina como undefined para ocultar. */
  english: {
    levels: ["BÁSICO", "INTERMEDIÁRIO", "AVANÇADO", "FLUENTE"],
    /** índice (0–3) do nível atual: intermediário */
    current: 1,
  } as { levels: string[]; current: number } | undefined,
  experience: {
    role: "Membro da Diretoria de Projetos",
    company: "LAMIT",
    tags: [
      "Java",
      "Spring Boot",
      "SQL",
      "MySQL",
      "Supabase",
      "TypeScript",
      "Node.js",
      "Angular",
      "AWS",
      "Git",
    ],
    summary:
      "LAMIT é a Liga Acadêmica de Maratona, Inovação e Tecnologia. Em paralelo, construo projetos em equipe aplicando POO, banco de dados e boas práticas de engenharia de software.",
    bullets: [
      "Synapse: melhor solução industrial do Power Tech Hackathon 2026 (SENAI CIMATEC).",
      "Getrin: TCC do SENAI CIMATEC, gestão de treinamentos industriais, backend e testes.",
      "AIneedHealth: líder da equipe no hackathon NASA Space Apps 2026, com um protótipo de monitoramento de saúde.",
    ],
    contributionsTitle: "Em andamento",
    contributions: [
      "Estudos de Java, POO e Spring Boot.",
      "Projetos com foco em IA aplicada.",
    ],
  },
  whoami: [
    "[+] Estudante de Desenvolvimento de Sistemas e Engenharia de Software.",
    "[+] Membro da Diretoria de Projetos da LAMIT.",
    "[+] Apaixonado por IA e por tudo que ela pode facilitar na nossa vida.",
    "[!] Synapse: melhor solução industrial do Power Tech Hackathon 2026.",
    "[+] Líder da equipe do AIneedHealth no hackathon NASA Space Apps 2026.",
  ],
  certifications: [
    {
      period: "Credly",
      title: "AWS Data Engineering",
      org: "AWS",
      href: "https://www.credly.com/badges/652ca51e-4908-4cd7-b660-a231fdb34327/public_url",
      tags: ["AWS", "Dados"],
      pinned: true,
    },
    {
      period: "Credly",
      title: "AWS Cloud Foundations",
      org: "AWS",
      href: "https://www.credly.com/badges/a3f892e8-7107-478c-bb03-96056cb25fad/public_url",
      tags: ["AWS", "Cloud"],
      pinned: false,
    },
    {
      period: "Credly",
      title: "Cybersecurity Essentials",
      org: "Cisco",
      href: "https://www.credly.com/badges/c3f5f212-8b43-4029-abe1-0a6024e109fe/public_url",
      tags: ["Cisco", "Segurança"],
      pinned: false,
    },
    {
      period: "Credly",
      title: "Cyber Threat Management",
      org: "Cisco",
      href: "https://www.credly.com/badges/5a7d59fa-e422-4415-851b-3eff9dfa37dd/public_url",
      tags: ["Cisco", "Segurança"],
      pinned: false,
    },
  ],
};
