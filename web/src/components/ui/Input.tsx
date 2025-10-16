"use client";
import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className={`relative ${className ?? ""}`}>
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-500">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={`w-full rounded-md border border-[var(--border)] bg-white text-[var(--foreground)] placeholder-neutral-400 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 outline-none h-10 px-3 ${leftIcon ? "pl-9" : ""} ${rightIcon ? "pr-9" : ""}`}
          {...props}
        />
        {rightIcon && (
          <span className="absolute inset-y-0 right-3 flex items-center text-neutral-500">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";


