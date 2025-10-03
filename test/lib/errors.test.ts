import { describe, it, expect } from 'vitest';
import { ApiError, mapErrorToResponse } from '@/lib/errors';

describe('mapErrorToResponse', () => {
  it('maps ApiError to response body and status', () => {
    const err = new ApiError({ code: 'TEST', message: 'test', status: 422, details: { x: 1 } });
    const mapped = mapErrorToResponse(err);
    expect(mapped.status).toBe(422);
    expect(mapped.body).toHaveProperty('error');
    expect(mapped.body.error).toMatchObject({ code: 'TEST', message: 'test', details: { x: 1 } });
  });

  it('maps unknown error to internal error shape', () => {
    const mapped = mapErrorToResponse(new Error('boom'));
    expect(mapped.status).toBe(500);
    expect(mapped.body).toHaveProperty('error');
    expect(mapped.body.error).toMatchObject({ code: 'INTERNAL_ERROR' });
  });
});
