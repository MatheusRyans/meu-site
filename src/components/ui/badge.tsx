import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center font-mono", {
  variants: {
    variant: {
      /** Chip de tecnologia do terminal. */
      chip: "rounded-[3px] border border-term-line bg-term-bg/60 px-2.5 py-1 text-[11px] tracking-[0.04em] text-term-muted",
      /** Rótulo de empresa / instituição. */
      org: "gap-1.5 text-[11px] uppercase tracking-[0.14em] text-term-blue",
      pin: "text-term-amber",
    },
  },
  defaultVariants: { variant: "chip" },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
