import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Easing "expo-out" suave usado em todas as revelações do site. */
export const EASE_REVEAL = [0.22, 1, 0.36, 1] as const;

/**
 * Converte um valor de conteúdo em href seguro.
 * Enquanto o valor ainda for um placeholder ({{LINKEDIN}}), retorna "#".
 */
export function resolveHref(value: string): string {
  return value.startsWith("{{") ? "#" : value;
}
