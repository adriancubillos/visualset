import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as route from '@/app/api/color-pattern-usage/route';
import { prismaMock } from '../setup';
import colorPatternUsageService, { UsedCombination } from '@/services/colorPatternUsageService';
import { ApiError } from '@/lib/errors';
import { logger } from '@/utils/logger';

describe('color-pattern-usage route', () => {
  beforeEach(() => {
    // reset prisma mocks if used
    if (prismaMock.operator?.findMany) prismaMock.operator.findMany.mockReset?.();
    if (prismaMock.machine?.findMany) prismaMock.machine.findMany.mockReset?.();

    // reset / spy on logger
    vi.restoreAllMocks();
  });

  it('returns used combinations on success', async () => {
    const fake: UsedCombination[] = [
      { entityId: 'op1', entityType: 'operator', color: '#fff', pattern: 'dots', entityName: 'Op1' },
    ];
    const spyInfo = vi.spyOn(logger, 'info');
    const svcSpy = vi.spyOn(colorPatternUsageService, 'fetchUsedCombinations').mockResolvedValue(fake);

    const req = new Request('http://localhost/?entityType=operator');
    const res = (await route.GET(req as unknown as Request)) as unknown as {
      body: { usedCombinations: UsedCombination[] };
      opts?: { status?: number };
    };

    expect(res).toHaveProperty('body');
    expect(res.body.usedCombinations).toEqual(fake);
    expect(spyInfo).toHaveBeenCalled();
    expect(svcSpy).toHaveBeenCalledWith(expect.anything(), 'operator', expect.any(Object));
  });

  it('returns 400 when entityType is missing', async () => {
    const spyApiError = vi.spyOn(logger, 'apiError');
    const req = new Request('http://localhost/');
    const res = (await route.GET(req as unknown as Request)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatchObject({ code: 'MISSING_ENTITY_TYPE' });
    expect(spyApiError).toHaveBeenCalledWith(
      'color-pattern-usage',
      '/api/color-pattern-usage',
      'entityType is required',
    );
  });

  it('maps ApiError from service to structured response', async () => {
    const apiErr = new ApiError({ code: 'UNSUPPORTED_ENTITY_TYPE', message: 'Unsupported', status: 400 });
    vi.spyOn(colorPatternUsageService, 'fetchUsedCombinations').mockRejectedValue(apiErr);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost/?entityType=unknown');
    const res = (await route.GET(req as unknown as Request)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatchObject({ code: 'UNSUPPORTED_ENTITY_TYPE', message: 'Unsupported' });
    expect(spyApiError).toHaveBeenCalled();
  });

  it('returns 500 on generic errors', async () => {
    vi.spyOn(colorPatternUsageService, 'fetchUsedCombinations').mockRejectedValue(new Error('boom'));
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost/?entityType=operator');
    const res = (await route.GET(req as unknown as Request)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatchObject({ code: 'INTERNAL_ERROR' });
    expect(spyApiError).toHaveBeenCalled();
  });

  it('handles null/undefined thrown value and uses fallback message', async () => {
    // Simulate a rejected promise with null to exercise the nullish fallback
    vi.spyOn(colorPatternUsageService, 'fetchUsedCombinations').mockRejectedValue(null as unknown);
    const spyApiError = vi.spyOn(logger, 'apiError');

    const req = new Request('http://localhost/?entityType=operator');
    const res = (await route.GET(req as unknown as Request)) as unknown as {
      body: { error: unknown };
      opts?: { status?: number };
    };

    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatchObject({ code: 'INTERNAL_ERROR' });
    // Ensure the logger received the fallback string when err is null
    expect(spyApiError).toHaveBeenCalledWith(
      'color-pattern-usage',
      '/api/color-pattern-usage',
      'Error fetching color pattern usage',
    );
  });
});
