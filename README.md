# Portfolio — Holograma de IA + Galeria Infinita

Next.js 16 · TypeScript · Tailwind CSS v4 · Framer Motion · shadcn/ui (padrão) · Lucide · Lenis.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Visual
Tema escuro e futurista, com a paleta **`#000000` · `#FFFFFF` · `#8C00F2`** (mais tons derivados do roxo para texto e brilhos).
O centro da home é um **holograma de IA** — uma cabeça humana neutra, só rosto e pescoço, parcialmente materializada (~70% formada, ~30% dissolvendo em partículas) — sobre a galeria arrastável de projetos.

- **Holograma** (`src/components/hologram/AIHologram.tsx`): canvas 2D com projeção 3D própria, sem WebGL e sem three.js.
  Rosto procedural com relevo anatômico, iluminação por normais (luz principal + rim light), olhos com pálpebras que seguem o cursor,
  scans vertical/horizontal, fluxos de energia pela malha, partículas entrando e saindo, reconstrução contínua de partes do rosto,
  anéis/HUD/painéis orbitais, bloom controlado. **Clique** = pulso holográfico + dispersão temporária das partículas.
  Cores do holograma: `#00D4FF` · `#00FFF5` · `#8B5CF6` · branco (constantes no topo do arquivo).
- **Fundo** (`HoloBackground.tsx`): chuva de código/símbolos e rede de pontos que reage ao cursor (~30 fps).
- **Galeria** (`GalleryCanvas.tsx`): plano infinito arrastável (DOM + `translate3d`, 3 camadas de parallax), cards com os prints reais dos projetos.
- **Páginas de projeto** e **perfil técnico**: mesmas cores, tipografia Space Grotesk (UI em DM Sans, terminal em IBM Plex Mono).
- `prefers-reduced-motion`: holograma e fundo renderizam um quadro estático.

## Personalizar
Todo o conteúdo editável está em `src/content/site.ts` (nome, bio, links, projetos, perfil técnico).
Links vazios ou `{{PLACEHOLDER}}` viram `#` automaticamente.

- **Projetos:** altere `projects` em `site.ts`; as rotas `/projetos/[slug]` são geradas sozinhas. Prints em `public/projects/*.webp` (campo `image`).
- **Cores e fontes:** tokens em `src/app/globals.css` (`@theme`); fontes em `src/app/layout.tsx`.
- **Holograma:** paleta e luzes no topo de `AIHologram.tsx`; formato do rosto em `faceRelief()` / `headHalfWidth()`; quantidade de partículas em `buildModel()` (`HR`, `HP`).
- **Rolagem suave (Lenis):** `src/components/frame/SmoothScroll.tsx` — só nas páginas com scroll (não na home).

## Estrutura
```
src/
├─ app/
│  ├─ layout.tsx · template.tsx · globals.css
│  ├─ page.tsx                      # home (holograma + galeria)
│  ├─ projetos/[slug]/page.tsx      # case study
│  └─ perfil-tecnico/page.tsx       # terminal
├─ components/
│  ├─ frame/{Frame,SmoothScroll}.tsx
│  ├─ hologram/{AIHologram,HoloBackground}.tsx
│  ├─ gallery/{GalleryCanvas,HomeExperience,PlaceholderArt}.tsx
│  ├─ project/{ProjectHero,FeatureCards,AboutCard,ClosingCta,Reveal}.tsx
│  ├─ profile/TerminalProfile.tsx
│  └─ ui/{button,badge,card,separator}.tsx
├─ content/site.ts                  # TODO o conteúdo editável
└─ lib/utils.ts
public/projects/                    # prints dos projetos
docs/                               # análise, design system, wireframes, prompt
```

Documentação: [`docs/01-ANALISE-E-ESPECIFICACAO.md`](docs/01-ANALISE-E-ESPECIFICACAO.md) · [`docs/02-PROMPT-DE-DESIGN.md`](docs/02-PROMPT-DE-DESIGN.md).

## Próximos passos
Modelo 3D de cabeça real (varredura) amostrado em partículas para mais fidelidade, SEO por projeto (OG images), analytics (GA4), testes E2E com Playwright, deploy na Vercel.
