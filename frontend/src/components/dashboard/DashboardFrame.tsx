"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface DashboardFrameProps {
  admin?: boolean;
  animate?: boolean;
  navigationLabel: string;
  mainLabel?: string;
  mainLabelledBy?: string;
  mainLive?: "polite" | "off";
  brand: ReactNode;
  navigation: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
}

/** Cadre visuel commun Viewer/Admin. Chaque espace conserve sa navigation et ses permissions. */
export function DashboardFrame({
  admin = false,
  animate = false,
  navigationLabel,
  mainLabel,
  mainLabelledBy,
  mainLive,
  brand,
  navigation,
  topbar,
  children,
}: DashboardFrameProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="skuup-dashboard-host">
      <div
        className={`skuup-premium-dashboard-shell skuup-dashboard-shared-frame${admin ? " skuup-premium-admin-shell skuup-admin-shell-v3" : ""}`}
      >
        <aside
          className="skuup-premium-dashboard-nav"
          aria-label={navigationLabel}
        >
          {brand}
          {navigation}
        </aside>
        <motion.main
          className="skuup-premium-dashboard-content"
          aria-label={mainLabel}
          aria-labelledby={mainLabelledBy}
          aria-live={mainLive}
          initial={animate && !reduceMotion ? { opacity: 0, y: 12 } : false}
          animate={animate ? { opacity: 1, y: 0 } : undefined}
          transition={animate ? { duration: 0.28, ease: "easeOut" } : undefined}
        >
          {topbar}
          {children}
        </motion.main>
      </div>
    </div>
  );
}
