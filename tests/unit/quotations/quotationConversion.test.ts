import { describe, expect, it } from 'vitest';
import { findConversion } from '../../../src/features/quotations/quotationConversion';

const insert = (type: string) => ({ id: 1, action_type: 'INSERT', new_data: JSON.stringify({ quotation_type: type }), changed_at: '2026-10-31T08:00:00Z' });
const customer = (id: number, at: string, extra = {}) => ({ id, action_type: 'UPDATE', user_name: 'Steve Jobs', new_data: JSON.stringify({ customer: {}, ...extra }), changed_at: at });

describe('findConversion', () => {
  it('uses the explicit marker', () => {
    const marked = customer(3, '2026-10-31T09:00:00Z', { converted_from_type: 'INTERNAL' });
    expect(findConversion([marked, customer(2, '2026-10-31T08:30:00Z'), insert('INTERNAL')])?.id).toBe(3);
  });

  it('older records: the first customer change after an internal create', () => {
    expect(findConversion([customer(5, '2026-10-31T10:00:00Z'), customer(4, '2026-10-31T09:00:00Z'), insert('INTERNAL')])?.id).toBe(4);
  });

  it('a customer quotation from the start was never converted', () => {
    expect(findConversion([customer(4, '2026-10-31T09:00:00Z'), insert('CUSTOMER')])).toBeNull();
    expect(findConversion([])).toBeNull();
  });
});
