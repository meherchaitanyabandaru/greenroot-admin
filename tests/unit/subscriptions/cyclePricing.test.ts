import { describe, expect, it } from 'vitest';
import { CYCLES, cyclePrice } from '../../../src/features/subscriptions/cyclePricing';

describe('cyclePrice', () => {
  it('matches the published prices for every plan and cycle', () => {
    const want: Record<number, number[]> = {
      299: [299, 852.15, 1614.6, 3049.8],
      499: [499, 1422.15, 2694.6, 5089.8],
      999: [999, 2847.15, 5394.6, 10189.8],
    };
    for (const [monthly, prices] of Object.entries(want)) {
      expect(CYCLES.map((c) => cyclePrice(Number(monthly), c.months, c.discount))).toEqual(prices);
    }
  });
});
