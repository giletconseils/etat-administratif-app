"use client";
import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
};

export function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const base = "btn-cursor";
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  } as const;
  const variants = {
    primary: "text-white border-cursor-accent-button",
    secondary: "btn-cursor-secondary",
    ghost: "bg-transparent text-cursor-text-primary hover:bg-cursor-hover border border-cursor-border-primary",
  } as const;

  const getButtonStyle = () => {
    if (variant === 'primary') {
      return {
        backgroundColor: 'var(--cursor-accent-button)',
        borderColor: 'var(--cursor-accent-button)',
      };
    }
    return {};
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'primary') {
      e.currentTarget.style.backgroundColor = 'var(--cursor-accent-button-hover)';
      e.currentTarget.style.borderColor = 'var(--cursor-accent-button-hover)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'primary') {
      e.currentTarget.style.backgroundColor = 'var(--cursor-accent-button)';
      e.currentTarget.style.borderColor = 'var(--cursor-accent-button)';
    }
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className ?? ""}`}
      disabled={disabled || isLoading}
      style={getButtonStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {isLoading && (
        <div className="mr-2 spinner-cursor" />
      )}
      {children}
    </button>
  );
}


