import type { HTMLAttributes } from "react";

// Carte de base du design system : coins arrondis, fond légèrement plus
// clair que la page, effet de lueur violette (docs/06-frontend-design-system.md).
export function CarteGlow({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skuup-card rounded-carte bg-background-elevated shadow-glow transition-shadow duration-300 hover:shadow-glow-hover p-6 ${className}`}
      role={props.role ?? "region"}
      {...props}
    >
      {children}
    </div>
  );
}
