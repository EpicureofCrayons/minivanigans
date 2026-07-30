import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "border border-[#45c7ff]/40 bg-gradient-to-r from-[#087ff5] to-[#00baf3] text-white shadow-[0_7px_20px_rgba(0,132,255,0.22)] hover:brightness-110 hover:shadow-[0_9px_26px_rgba(0,153,255,0.32)]",
  secondary: "border border-line bg-surface-2 text-fg hover:border-brand/50 hover:bg-surface",
  ghost: "text-muted hover:bg-surface-2 hover:text-fg",
  danger: "bg-danger text-white hover:brightness-110",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "secondary", className, ...rest }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-card px-3.5 py-2 text-sm font-semibold",
        "transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
      {...rest}
    />
  );
}
