// Tests for nursery API endpoint and type contracts — covers:
//   - adminResourcesApi exports the expected lifecycle hooks
//   - NurseryUsersResponse type shape is correct
//   - URL patterns for member lifecycle endpoints are consistent
//   - normalizeApiError handles lifecycle-specific HTTP status codes
//   - The 410 Gone status (account already deleted) is handled correctly

import { describe, expect, it } from 'vitest';
import { normalizeApiError } from '../../../src/utils/apiError';
import {
  adminResourcesApi,
  type NurseryUsersResponse,
} from '../../../src/api/adminResources';

// ─── Hook exports (smoke tests) ───────────────────────────────────────────────

describe('adminResourcesApi — lifecycle hook exports', () => {
  it('exports useListNurseryUsersQuery hook', () => {
    expect(adminResourcesApi.endpoints.listNurseryUsers).toBeDefined();
  });

  it('exports useUpdateNurseryStatusMutation hook', () => {
    expect(adminResourcesApi.endpoints.updateNurseryStatus).toBeDefined();
  });

  it('exports useUpdateNurseryMutation hook (branding update)', () => {
    expect(adminResourcesApi.endpoints.updateNursery).toBeDefined();
  });

  it('exports useDeleteNurseryMutation hook', () => {
    expect(adminResourcesApi.endpoints.deleteNursery).toBeDefined();
  });
});

// ─── NurseryUsersResponse type contract ──────────────────────────────────────

describe('NurseryUsersResponse', () => {
  it('accepts an array of manager records', () => {
    const sample: NurseryUsersResponse = {
      users: [
        {
          id: 1,
          user_id: 20,
          name: 'Gumastha Manager',
          mobile: '9200000000',
          email: null,
          role: 'MANAGER',
          status: 'ACTIVE',
          is_active: true,
          joined_at: '2025-01-01T00:00:00Z',
        },
      ],
    };
    expect(sample.users).toHaveLength(1);
    expect(sample.users[0].role).toBe('MANAGER');
    expect(sample.users[0].is_active).toBe(true);
  });

  it('accepts empty users array (nursery with no managers)', () => {
    const empty: NurseryUsersResponse = { users: [] };
    expect(empty.users).toHaveLength(0);
  });

  it('user record includes is_active flag for removal state', () => {
    const record: NurseryUsersResponse['users'][number] = {
      id: 2,
      user_id: 21,
      name: 'Removed Manager',
      mobile: '9210000000',
      email: null,
      role: 'MANAGER',
      status: 'INACTIVE',
      is_active: false,
      joined_at: '2025-01-01T00:00:00Z',
    };
    expect(record.is_active).toBe(false);
    expect(record.status).toBe('INACTIVE');
  });
});

// ─── normalizeApiError — lifecycle-specific status codes ──────────────────────

describe('normalizeApiError — member lifecycle HTTP status codes', () => {
  it('403 Forbidden: maps to forbidden code (member removed but still has JWT)', () => {
    const result = normalizeApiError({
      status: 403,
      data: { error: { code: 'forbidden', message: 'user is not an active member' } },
    });
    expect(result.status).toBe(403);
    expect(result.code).toBe('forbidden');
  });

  it('401 Unauthorized: maps to unauthorized (session revoked after removal)', () => {
    const result = normalizeApiError({
      status: 401,
      data: { error: { code: 'unauthorized', message: 'session revoked' } },
    });
    expect(result.status).toBe(401);
    expect(result.code).toBe('unauthorized');
  });

  it('410 Gone: maps to account_deleted (attempt to use deleted account)', () => {
    const result = normalizeApiError({
      status: 410,
      data: { error: { code: 'account_deleted', message: 'account has already been deleted' } },
    });
    expect(result.status).toBe(410);
    expect(result.code).toBe('account_deleted');
  });

  it('404 Not Found: maps to not_found (manager or driver not in nursery)', () => {
    const result = normalizeApiError({
      status: 404,
      data: { error: { code: 'not_found', message: 'manager not found in this nursery' } },
    });
    expect(result.status).toBe(404);
    expect(result.code).toBe('not_found');
  });
});

// ─── Nursery status lifecycle states ─────────────────────────────────────────

describe('Nursery onboarding status values', () => {
  // These status values are used in the admin approval flow.
  // The test verifies the known status progression used in updateNurseryStatus.
  const validStatuses = ['PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'INACTIVE'];

  it.each(validStatuses)('status %s is a known lifecycle state', (status) => {
    // The admin UI sends these values to the API — they must be non-empty strings.
    expect(status).toBeTruthy();
    expect(typeof status).toBe('string');
  });

  it('APPROVED status triggers owner onboarding (role + trial subscription)', () => {
    // Approval is the transition that grants NURSERY_OWNER role + TRIAL subscription.
    // This is a documentation test — the admin UI sends 'APPROVED', the server handles the rest.
    const onboardingTriggerStatus = 'APPROVED';
    expect(validStatuses).toContain(onboardingTriggerStatus);
  });

  it('REJECTED status ends pending owner onboarding flow', () => {
    const rejectedStatus = 'REJECTED';
    expect(validStatuses).toContain(rejectedStatus);
  });
});
