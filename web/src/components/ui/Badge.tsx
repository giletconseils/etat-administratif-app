import * as React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "neutral" | "success" | "danger" | "info";
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  const variants = {
    neutral: "bg-neutral-100 text-neutral-700 border border-[var(--border)]",
    success: "bg-green-50 text-green-700 border border-green-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    info: "bg-blue-50 text-blue-700 border border-blue-200",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${variants[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}


