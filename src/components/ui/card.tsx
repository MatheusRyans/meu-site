import * as React from "react";
import { cn } from "@/lib/utils";

/** Card escuro dos "Funcionalidades" (case study). */
export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative overflow-hidden rounded-3xl border border-violet/25 bg-[#0b0614]/80 p-[30px] text-ink backdrop-blur [overflow-wrap:anywhere]",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      "font-sans text-[19.2px] font-semibold leading-[1.2] text-ink",
      className,
    )}
    {...props}
  />
);

export const CardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("font-sans text-[13px] leading-relaxed text-ink/60", className)}
    {...props}
  />
);

/** Painel do perfil técnico (terminal). */
export const Panel = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { title: string }
>(({ className, title, children, ...props }, ref) => (
  <section
    ref={ref}
    className={cn(
      "rounded-[4px] border border-term-line bg-term-panel px-4 pb-4 pt-[11px]",
      className,
    )}
    {...props}
  >
    <h2 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-term-text">
      <span className="text-term-dim">~/</span>
      {title}
    </h2>
    {children}
  </section>
));
Panel.displayName = "Panel";
