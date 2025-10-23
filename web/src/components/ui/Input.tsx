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
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-cursor-text-muted">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={`w-full rounded-md border border-cursor-border-primary bg-cursor-bg-secondary text-cursor-text-primary placeholder-cursor-text-muted focus-visible:ring-2 focus-visible:ring-cursor-accent-button focus-visible:ring-offset-0 focus-visible:border-cursor-accent-button outline-none h-10 px-3 transition-all ${leftIcon ? "pl-9" : ""} ${rightIcon ? "pr-9" : ""}`}
          {...props}
        />
        {rightIcon && (
          <span className="absolute inset-y-0 right-3 flex items-center text-cursor-text-muted">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";


