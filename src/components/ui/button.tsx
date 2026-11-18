import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans uppercase transition-[transform,box-shadow,opacity,background-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Pílula preta do hero (CTA primário sobre fundo creme). */
        pill: "rounded-full bg-violet px-[18px] py-3 text-[10px] tracking-[0.18em] text-white shadow-[0_0_28px_-4px_rgba(140,0,242,0.9)] hover:-translate-y-0.5 hover:brightness-125 active:translate-y-0",
        /** Pílula com contorno (CTA secundário). */
        pillOutline:
          "rounded-full border border-ink/70 px-[18px] py-[11px] text-[10px] tracking-[0.18em] text-ink hover:-translate-y-0.5 hover:bg-ink hover:text-black active:translate-y-0",
        /** Pílula clara do bloco final (sobre fundo escuro). */
        pillLight:
          "rounded-full bg-cream px-[27px] py-[13px] text-[10px] tracking-[0.18em] text-ink hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)] active:translate-y-0",
        /** Botões do perfil técnico (terminal). */
        terminal:
          "rounded-[4px] border border-term-line bg-transparent px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] text-term-muted hover:border-term-dim hover:text-term-text",
        danger:
          "rounded-[4px] border border-term-red/50 bg-term-red/10 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.12em] text-term-red hover:bg-term-red/20",
        ghost: "tracking-[0.08em] hover:opacity-60",
      },
    },
    defaultVariants: { variant: "pill" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
