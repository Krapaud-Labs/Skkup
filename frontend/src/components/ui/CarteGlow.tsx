import type { HTMLAttributes } from "react";

// Carte de base du design system : coins arrondis, fond légèrement plus
// clair que la page, effet de lueur violette (contexte frontend agentic).
export function CarteGlow({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skuup-card rounded-carte bg-background-elevated shadow-glow transition-shadow duration-300 hover:shadow-glow-hover p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
