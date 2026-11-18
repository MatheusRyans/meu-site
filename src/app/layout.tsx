import type { Metadata, Viewport } from "next";
import { DM_Sans, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { Frame } from "@/components/frame/Frame";
import { SmoothScroll } from "@/components/frame/SmoothScroll";
import { site } from "@/content/site";
import "./globals.css";

const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${site.nome} / Portfolio`, template: `%s — ${site.nome}` },
  description: site.headline,
  openGraph: { title: `${site.nome} / Portfolio`, description: site.headline },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${space.variable} ${dmSans.variable} ${plexMono.variable}`}
    >
      <body>
        <a
          href="#conteudo"
          className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-full bg-white px-4 py-2 text-xs uppercase tracking-widest text-black focus:translate-y-0"
        >
          Pular para o conteúdo
        </a>
        <SmoothScroll />
        <Frame />
        <div id="conteudo">{children}</div>
      </body>
    </html>
  );
}
