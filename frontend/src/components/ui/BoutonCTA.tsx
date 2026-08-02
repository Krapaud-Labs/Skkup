import type { ButtonHTMLAttributes } from "react";

type Variante = "primaire" | "secondaire";

interface BoutonCTAProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

// Bouton d'action principal du design system : dégradé violet vers
// cyan pour le primaire, contour pour le secondaire, coins très
// arrondis, lueur au survol (docs/06-frontend-design-system.md).
export function BoutonCTA({
  variante = "primaire",
  className = "",
  children,
  ...props
}: BoutonCTAProps) {
  const styleParVariante: Record<Variante, string> = {
    primaire:
      "bg-gradient-to-r from-accent-violet to-accent-cta text-background font-bold hover:shadow-glow-hover",
    secondaire:
      "border border-accent-violet-light text-foreground hover:shadow-glow",
  };

  return (
    <button
      className={`rounded-full px-6 py-3 transition-shadow duration-300 ${styleParVariante[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
