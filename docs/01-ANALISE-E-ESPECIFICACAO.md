# Análise e Especificação — Portfolio "Galeria Infinita"

> Engenharia reversa de **estilo, arquitetura visual e UX** do site de referência,
> **atualizada para o visual atual**: tema escuro e futurista (`#000000` · `#FFFFFF` · `#8C00F2`)
> com um holograma de IA no centro da home. Nenhum texto, imagem, logo ou marca do site
> de referência foi reaproveitado; o conteúdo real do portfólio fica em `src/content/site.ts`.
>
> As seções 1 e 7 descrevem o site **original analisado**; as demais descrevem o que está implementado hoje.

## 1. Análise completa do site

**Natureza:** portfólio autoral de uma só pessoa, de baixa densidade textual e altíssima
intenção de marca. A home **não é uma página de texto**: é uma experiência de
exploração (canvas WebGL). Três "modos" de página, cada um com personalidade própria:

| Rota (original) | Modo | Fundo | Tipografia | Função |
|---|---|---|---|---|
| `/` | Galeria WebGL infinita | branco `#fff` | Asul (display) + DM Sans | Descoberta, "wow" inicial |
| `/<projeto>` | Case study editorial | creme `#f9f6f1` + gradiente radial | serif Iowan/Palatino + DM Sans | Narrativa de um projeto |
| `/technical-profile` | Dashboard de terminal | `#07080a` | IBM Plex Mono | Credibilidade técnica |

*(tabela do site original. Hoje as três rotas são escuras — ver seção 3.)*

**Técnica observada:** SPA React (bundle Vite, CSS Modules com hash), canvas **three.js r182**
(com OGL no bundle), `<video>` oculto para texturas, header `position:fixed` com
`mix-blend-mode: difference`, revelações com `cubic-bezier(0.22,1,0.36,1)`.

**Princípios de UX identificados**
1. *Moldura constante, conteúdo mutável* — header e rodapé fixos; só o "miolo" muda.
2. *Inversão automática de contraste* via blend-mode → mesmo header em fundo claro, creme e escuro.
3. *Descoberta por gesto* — instrução mínima ("drag to interact") + pista animada.
4. *Profundidade como hierarquia* — longe = pequeno/borrado/translúcido; perto = grande/nítido.
5. *Três linguagens, uma assinatura* — contraste sério (galeria branca → terminal escuro) coeso por tipografia em caixa-alta e espaçamento generoso.
6. *Poucas palavras, escala grande* — títulos serif enormes com última linha em **itálico dourado**.

## 2. Mapa de componentes

```
RootLayout (fontes, skip-link)
├─ Frame ............ header fixo (LinkedIn + nav) + dica inferior [mix-blend-difference]
└─ template ......... transição de página (fade + y12, 0.6s)

/  → HomeExperience
     ├─ LoadingOverlay ... 3 barras pulsantes + nome (1.4s, 1ª visita da sessão)
     ├─ HoloBackground ... chuva de código + rede de pontos reativa ao cursor (canvas, ~30fps)
     ├─ GalleryCanvas .... plano infinito, 3 camadas, inércia; cards com prints reais dos projetos
     ├─ Vinheta + cápsula de vidro (CSS) atrás da IA
     ├─ AIHologram ....... cabeça humana de partículas/wireframe + olhos + HUD (canvas, pointer-events: none)
     ├─ Título ........... nome (Space Grotesk, brilho) na base + "Arraste para interagir"
     └─ DragCue .......... ‹──●──› com ponto oscilando; some no 1º arraste

/projetos/[slug] → ProjectPage
     ├─ ProjectHero ...... título c/ MaskLine + descrição + CTA pílula roxa + "Repositório" + ShotMock (print em moldura de navegador)
     ├─ FeatureCards ..... divisor c/ rótulo + 3× Card de vidro escuro (índice, rótulo, título, texto)
     ├─ AboutCard ........ cartão escuro r32 com borda violeta: avatar, eyebrow, bio, grade 2×2
     ├─ ClosingCta ....... bloco r32 em degradê violeta: ✦, título itálico, botão pílula clara
     └─ Reveal / MaskLine  primitivas de animação

/perfil-tecnico → TerminalProfile
     ├─ Header ........... root@handle · ~/nome-index · [Ir ao portfólio] [KILLSWITCH]
     ├─ Panel id / stack / english / experience / whoami / certifications
     ├─ Whoami ........... log com digitação por linha + CLEAR | REFRESH
     └─ Efeitos .......... grid de pontos, scanlines, glow que segue o cursor, tela de "sistema desligado"

ui (shadcn-style): Button(pill, pillOutline, pillLight, terminal, danger, ghost) · Badge(chip, org, pin) · Card/Panel · Separator
```

## 3. Design System

### Cores
Paleta-base: **`#000000` · `#FFFFFF` · `#8C00F2`**. O roxo ganha tons derivados para legibilidade (texto, bordas, brilhos).
| Token | Valor | Uso |
|---|---|---|
| `ink` | `#ffffff` | texto principal |
| `cream` | `#0a0612` | superfícies escuras (cards, blocos) |
| `paper` | `#0d0818` | cartão "sobre" |
| `violet` | `#8c00f2` | cor de marca: botões, selo, glows |
| `gold` / `gold-deep` | `#b565ff` | destaques de texto (itálico do título, rótulos) — nome mantido por compatibilidade |
| `bronze` | `#2a0a4d` | numerais, círculos decorativos, bloco final |
| `term-bg / panel / line` | `#050308 / #0d0816 / #24173a` | terminal |
| `term-text / muted / dim` | `#e2e4e8 / #a4a8b0 / #8b9098` | texto do terminal |
| `term-amber / blue / green / red` | `#c58cff / #dcc0ff / #e3c9ff / #e97063` | destaques do terminal (vermelho só no killswitch) |

**Holograma** (constantes em `AIHologram.tsx`): azul elétrico `#00D4FF` (malha e partículas), ciano neon `#00FFF5` (olhos), roxo `#8B5CF6` (sombras e preenchimento), branco-ciano (realces).

### Tipografia
| Papel | Fonte | Detalhes |
|---|---|---|
| Display (marca, nome) | **Space Grotesk** 400/500/700 | uppercase, ~20px (logo) / até 44px (nome, tracking .12em, brilho roxo) |
| Editorial (títulos de case) | Space Grotesk | `clamp(2.5rem, 5.4vw, 5.25rem)`, lh .92, tracking −0.035em; última linha itálico em violeta claro |
| UI / corpo | **DM Sans** | nav 15.6px, tracking .08em, uppercase; corpo 13–15px; rótulos 9–10px tracking .25–.3em |
| Terminal | **IBM Plex Mono** | 14.5px base; h1 27px; rótulos 9–11px caixa-alta |

### Espaçamento, raios, sombras
Base 4px · gutters 30px (desktop) / 16px (mobile) · header padding 18px ·
raios: pílula 999px, card 24px, bloco grande 32px, terminal 4px ·
sombras longas e suaves (`0 40px 80px -30px rgba(0,0,0,.45)`).

### Motion
| Elemento | Duração | Easing | Detalhe |
|---|---|---|---|
| Revelação de seção | 750ms | `cubic-bezier(.22,1,.36,1)` | y 24→0, opacity 0→1, stagger .1s |
| Título (máscara) | 950ms | idem | y 105%→0, stagger .12s |
| Entrada dos cards da galeria | 900ms | idem | scale .82→1, blur 8→n, delay por índice (25ms) |
| Inércia da galeria | por frame | lerp **0.1** | momentum = velocidade × 9 |
| Hover do card | spring | — | scale 1.07, opacity 1, blur 0 |
| Transição de página | 600ms | ease-reveal | opacity + y12 |
| Pílula (hover) | 150–200ms | ease | translateY −2px |
| Print do hero (ShotMock) | 6s | easeInOut ∞ | flutuação y 0→−8→0 |
| Holograma: flutuação / respiração | ~0,8 Hz / ~1 Hz | seno | bob de 2% da altura; busto expande 1,8% |
| Holograma: batimento do núcleo | a cada 3,4s | exp. | onda de brilho do centro do rosto para fora + ondulação no chão |
| Holograma: scans | vertical 4s · horizontal 6s | linear | plano de luz varrendo o rosto; distorção local da malha |
| Holograma: clique | 1,8s (pulso) · 3,4s (dispersão) | ataque rápido + decaimento exp. | anel expandindo + partículas afastadas e retornando |
| Loader | 1s ∞ | ease-reveal | scaleY .35↔1, defasagem .12s |

Todos respeitam `prefers-reduced-motion`.

### Breakpoints
`<640` (mobile: cards da galeria ×0.6, nav menor) · `md 768` (grades 2–3 col) · `lg 1024` (hero em 3 colunas, terminal em 2 colunas).

## 4. Arquitetura das páginas / 5. Estrutura de seções

**Home** — 1 viewport fixo, sem scroll (`position:fixed; inset:0`). Camadas (z): fundo preto + névoa violeta (0) → HoloBackground (0) → galeria (10) → vinheta central (15) → cápsula de vidro (16) → AIHologram (20) → título (30) → frame (50) → loader (60). O holograma e a vinheta têm `pointer-events: none`, então a galeria continua arrastável por baixo.

**Case study** — scroll vertical: Hero (100vh) → Funcionalidades → Sobre → CTA final → rodapé.

**Perfil técnico** — grade `290px | 1fr`: esquerda (id, stack, english), direita (experience; whoami + certifications).

## 6. Wireframes

```
HOME (desktop)
┌──────────────────────────────────────────────────────────┐
│ LINKEDIN                    HOME SYNAPSE GETRIN AINEEDHEALTH│ ← mix-blend-difference
│  ┌panel┐        ╭──────╮        ┌────┐                    │
│  │ HUD │      ╭─┤ ◉  ◉ ├─╮      │near│  ◇ (sólido 3D)     │
│  └─────┘      │ ╰─┬──┬─╯ │      └────┘                    │
│   ▫ cards       ╰──┴──╯  ◌ anéis / órbitas                │
│  (galeria)  ═══ anéis no chão ═══   ┌panel┐                │
│            NOME · ARRASTE PARA INTERAGIR  ‹ ──●── ›        │
│ IR PARA O PERFIL TÉCNICO                                  │
└──────────────────────────────────────────────────────────┘

CASE STUDY
┌─ HERO ───────────────────────────────────────────────────┐
│ título linha 1         ┌──────────────────────────┐       │
│ título linha 2         │ ● ● ●   (print do projeto)│       │
│ *destaque violeta*     │                           │       │
│ descrição              └──────────────────────────┘       │
│ (●) [VER O PROJETO ↓] [REPOSITÓRIO ↗]                     │
├─ ─── ── SEÇÃO ── ─── ────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐   cards de vidro escuro r24    │
│ │ 01   │ │ 02   │ │ 03   │                                │
│ └──────┘ └──────┘ └──────┘                                │
│ ╭────── cartão escuro r32 (borda violeta) ╮                │
│ │      (avatar) EYEBROW / bio            │                 │
│ │  [bloco 1] [bloco 2] / [bloco 3] [4]   │                 │
│ ╰────────────────────────────────────────╯                 │
│ ╭────────── bloco violeta r32 ──────────╮                 │
│ │   ── ✦ ──  EMPRESA   *título itálico*  │ [CTA ↓]         │
│ ╰────────────────────────────────────────╯                 │
└──────────────────────────────────────────────────────────┘

PERFIL TÉCNICO
┌ root@handle                    [IR AO PORTFÓLIO] [⏻ KILLSWITCH]
│ ~/nome-index
├──────────┬───────────────────────────────────────────────┐
│ ~/id     │ ~/experience  (scroll interno, chips, ▸ itens) │
│ ~/stack  ├───────────────────────────┬───────────────────┤
│ ~/english│ ~/whoami  CLEAR | REFRESH │ ~/certifications   │
└──────────┴───────────────────────────┴───────────────────┘
```

## 7. Bibliotecas prováveis no original vs. implementação aqui

| Original (inferido) | Aqui |
|---|---|
| React + Vite + CSS Modules | Next.js 16 (App Router) + Tailwind v4 |
| three.js r182 (WebGL) | Galeria em DOM + `translate3d` (3 camadas, parallax); holograma em **canvas 2D** com projeção 3D própria |
| animações CSS manuais | Framer Motion + keyframes CSS |
| scroll nativo | Lenis (só nas páginas com scroll; a home é fixa) |
| Font Awesome (brands) | Lucide Icons |

**Trade-off consciente:** three.js ficou fora porque a stack obrigatória não o inclui, e o holograma roda a ~60 fps
com canvas 2D (sprites pré-renderizados, splat de partículas em buffer único, bloco de bloom por down/upsample).
Se quiser mais fidelidade, o rosto pode ser trocado por um modelo 3D real amostrado em partículas sem tocar nas páginas.

## 8. Holograma de IA (`src/components/hologram/AIHologram.tsx`)

**Conceito:** cabeça humana neutra e serena (só rosto e pescoço, busto dissolvendo), parcialmente materializada, que parece uma inteligência
ativa observando o visitante. Sem corpo, sem armadura, sem estética gamer.

| Aspecto | Implementação |
|---|---|
| Geometria | grade de ~4.800 pontos: anéis horizontais (`HR`×`HP`) com relevo facial por gaussianas (`faceRelief`): testa, arcada, órbitas, nariz, lábios, bochechas, queixo, orelhas |
| Iluminação | normais por diferenças finitas; luz principal + rim light (fresnel) por ponto; tom azul/branco nas áreas iluminadas, roxo nas sombras; faces de trás mais fracas (translucidez) |
| 70% / 30% | ~30% dos pontos (lado esquerdo, topo, nuca, busto) são "fluxo": derivam em ciclo, aparecem e somem; arestas só existem entre pontos formados |
| Reconstrução | "patches" aleatórios no rosto se desmontam e remontam a cada 1–3s |
| Olhos | contorno de pálpebras (amêndoa), íris em gradiente radial recortada por `clip`, fibras girando, núcleo energético, pulsos orbitando, piscada rara; seguem o cursor com amplitude mínima |
| Malha viva | pulsos de luz correndo por meridianos/paralelos, linhas neurais que conectam/desconectam, scans vertical e horizontal, ondulação holográfica |
| Entorno | cone volumétrico, anéis giratórios no chão, 3 órbitas inclinadas com partículas, arcos de HUD com marcações, 4 painéis de vidro (barras, gráfico, código, confiança), linhas de dados ligando painéis à IA, octaedro e cubo wireframe |
| Interação | cursor → inclinação da cabeça, parallax em camadas, brilho +28% perto do rosto; clique → pulso expansivo + dispersão e retorno das partículas (arrasto da galeria não conta como clique) |
| Luz | bloom por down/upsample (sem `ctx.filter`, funciona no Safari), glow volumétrico, núcleo pulsante na região dos olhos |
| Performance | partículas desenhadas por *splat* aditivo num buffer (1 `drawImage`), sprites de brilho pré-renderizados, sem `shadowBlur`; DPR limitado (1.5 em telas grandes) |
| Acessibilidade | `aria-hidden`; `prefers-reduced-motion` → um quadro estático |

**Armadilha conhecida:** um buffer opaco desenhado com `globalCompositeOperation = "lighter"` sobre canvas transparente vira um
retângulo preto (o alfa soma). O buffer de partículas converte a energia acumulada em RGBA com alfa antes do `putImageData`.
