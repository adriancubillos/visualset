/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import * as taskByIdRoute from '@/app/api/tasks/[id]/route';
import { prismaMock } from '../setup';

// Minimal NextRequest-like shim for route handlers that only need params
class FakeRequestCookies {
  private store = new Map<string, string>();
  get(name: string) {
    return this.store.get(name) ?? null;
  }
  getAll() {
    return Array.from(this.store.values());
  }
  has(name: string) {
    return this.store.has(name);
  }
}

class FakeNextRequest extends Request {
  // we only need a minimal cookie-like API for handlers exercised in tests
  cookies = new FakeRequestCookies();
  nextUrl = new URL('http://localhost');
  page = undefined as unknown;
  ua = undefined as unknown;
}

type ResponseMock = { body: unknown; opts?: { status?: number } };

describe('GET /api/tasks/[id]', () => {
  beforeEach(() => {
    prismaMock.task.findUnique.mockReset();
  });

  it('returns mapped task when found', async () => {
    const fakeTask = {
      id: 't1',
      title: 'Task 1',
      item: { id: 'i1', project: { id: 'p1', name: 'Project 1' } },
      machine: null,
      operator: null,
    };
    prismaMock.task.findUnique.mockResolvedValue(fakeTask);

    const res = (await taskByIdRoute.GET(new FakeNextRequest('http://localhost') as unknown as any, {
      params: Promise.resolve({ id: 't1' }),
    })) as ResponseMock;
    // our mocked NextResponse returns { body, opts }
    expect(res).toHaveProperty('body');
    interface TaskBody {
      id: string;
    }
    const body = res.body as TaskBody;
    expect(body.id).toBe('t1');
  });

  it('returns 404 when not found', async () => {
    prismaMock.task.findUnique.mockResolvedValue(null);
    const res = (await taskByIdRoute.GET(new FakeNextRequest('http://localhost') as unknown as any, {
      params: Promise.resolve({ id: 'missing' }),
    })) as ResponseMock;
    expect(res).toHaveProperty('opts');
    expect(res.opts).toHaveProperty('status', 404);
  });
});
