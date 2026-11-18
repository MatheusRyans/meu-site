"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_REVEAL } from "@/lib/utils";

/** Revelação ao entrar na viewport: opacity 0→1, y 24→0, 0.75s, ease-reveal. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.75, ease: EASE_REVEAL, delay }}
      className={className}
    >
      {children}
    </Comp>
  );
}

/** Linha de título com máscara: o texto sobe de dentro de um overflow hidden. */
export function MaskLine({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className={`block ${className ?? ""}`}
        initial={reduce ? false : { y: "105%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.95, ease: EASE_REVEAL, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}
