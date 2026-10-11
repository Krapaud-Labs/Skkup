export const DASHBOARD_V3_QA_FRAUD_FLAGS = Array.from(
  { length: 11 },
  (_, index) => ({
    id: `qa_dashv3_fraud_flag_${String(index + 1).padStart(2, '0')}`,
    type: `QA_DASHV3_${String(index + 1).padStart(2, '0')}`,
    details: `Signalement de recette DASH-V3 ${index + 1} pour valider la liste, la pagination et le panneau de modération.`,
    createdAt: new Date(Date.UTC(2026, 0, 1, 12, index, 0)),
  }),
);
