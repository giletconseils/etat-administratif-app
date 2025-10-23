import * as React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "neutral" | "success" | "danger" | "info";
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  const variants = {
    neutral: "bg-cursor-bg-tertiary text-cursor-text-secondary border border-cursor-border-primary",
    success: "bg-cursor-accent-green/10 text-cursor-accent-green border border-cursor-accent-green/20",
    danger: "bg-cursor-accent-red/10 text-cursor-accent-red border border-cursor-accent-red/20",
    info: "bg-cursor-accent-blue/10 text-cursor-accent-blue border border-cursor-accent-blue/20",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${variants[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}


