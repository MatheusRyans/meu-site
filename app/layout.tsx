import type { Metadata } from "next";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://meusite.example.com"),
  title: {
    default: "Matheus Ryans | Curadoria técnica",
    template: "%s | Matheus Ryans",
  },
  description:
    "Conteúdo técnico e curadoria de recursos para desenvolvimento, frontend, arquitetura e aprendizado contínuo.",
  openGraph: {
    title: "Matheus Ryans | Curadoria técnica",
    description:
      "Recursos, artigos e referências para desenvolvimento, tecnologia e formação contínua.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        <main className="page-shell">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
