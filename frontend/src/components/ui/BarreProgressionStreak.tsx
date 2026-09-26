interface BarreProgressionStreakProps {
  streakActuel: number;
  prochainPalier: number;
  anglais?: boolean;
}

// Barre de progression de série (streak) affichée sur le tableau de
// bord, jusqu'au prochain palier débloquant une carte à gratter.
export function BarreProgressionStreak({
  streakActuel,
  prochainPalier,
  anglais = false,
}: BarreProgressionStreakProps) {
  const pourcentage = Math.min(
    100,
    Math.round((streakActuel / prochainPalier) * 100),
  );

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm text-foreground-muted">
        <span>{streakActuel} {anglais ? "days" : "jours"}</span>
        <span>{anglais ? `Next tier: ${prochainPalier} days` : `Prochain palier : ${prochainPalier} jours`}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pourcentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-3 w-full overflow-hidden rounded-full bg-background-elevated"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-violet to-accent-violet-light shadow-glow transition-all duration-500"
          style={{ width: `${pourcentage}%` }}
        />
      </div>
    </div>
  );
}
