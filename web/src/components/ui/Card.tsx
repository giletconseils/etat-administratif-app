import * as React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div className={`card-surface ${className ?? ""}`} {...props} />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div className={`px-6 py-4 border-b border-cursor-border-primary ${className ?? ""}`} {...props} />
  );
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={`p-6 ${className ?? ""}`} {...props} />;
}

export function CardFooter({ className, ...props }: CardProps) {
  return (
    <div className={`px-6 py-4 border-t border-cursor-border-primary ${className ?? ""}`} {...props} />
  );
}


