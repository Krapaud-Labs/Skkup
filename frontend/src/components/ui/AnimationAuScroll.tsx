"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface AnimationAuScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variante?: "montee" | "gauche" | "droite" | "zoom" | "bascule";
}

/** Révèle progressivement un bloc lorsqu'il entre dans la fenêtre visible. */
export function AnimationAuScroll({
  children,
  className = "",
  delay = 0,
  variante = "montee",
}: AnimationAuScrollProps) {
  const element = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const cible = element.current;
    if (!cible) return;

    if (typeof IntersectionObserver === "undefined") {
      // This fallback intentionally reveals the content synchronously when the observer API is absent.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px 160px" },
    );
    observer.observe(cible);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={element}
      className={`skuup-reveal skuup-reveal-${variante} ${visible ? "skuup-reveal-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
