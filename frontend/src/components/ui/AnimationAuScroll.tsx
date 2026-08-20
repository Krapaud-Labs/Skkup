"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface AnimationAuScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Révèle progressivement un bloc lorsqu'il entre dans la fenêtre visible. */
export function AnimationAuScroll({
  children,
  className = "",
  delay = 0,
}: AnimationAuScrollProps) {
  const element = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const cible = element.current;
    if (!cible) return;

    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px" },
    );
    observer.observe(cible);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={element}
      className={`skuup-reveal ${visible ? "skuup-reveal-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
