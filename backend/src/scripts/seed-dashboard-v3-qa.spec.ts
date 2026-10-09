import { DASHBOARD_V3_QA_FRAUD_FLAGS } from './seed-dashboard-v3-qa.fixture';

describe('fixture QA DASH-V3 de modération', () => {
  it('déclare exactement onze signalements distincts et déterministes', () => {
    expect(DASHBOARD_V3_QA_FRAUD_FLAGS).toHaveLength(11);
    expect(new Set(DASHBOARD_V3_QA_FRAUD_FLAGS.map(({ id }) => id)).size).toBe(
      11,
    );
    expect(DASHBOARD_V3_QA_FRAUD_FLAGS.map(({ id }) => id)).toEqual(
      Array.from(
        { length: 11 },
        (_, index) =>
          `qa_dashv3_fraud_flag_${String(index + 1).padStart(2, '0')}`,
      ),
    );
    expect(
      DASHBOARD_V3_QA_FRAUD_FLAGS.every(
        ({ type, details, createdAt }) =>
          type.startsWith('QA_DASHV3_') &&
          details.includes('DASH-V3') &&
          createdAt instanceof Date,
      ),
    ).toBe(true);
  });
});
