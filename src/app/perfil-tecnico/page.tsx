import type { Metadata } from "next";
import { TerminalProfile } from "@/components/profile/TerminalProfile";

export const metadata: Metadata = { title: "Perfil Técnico" };

export default function TechnicalProfilePage() {
  return <TerminalProfile />;
}
