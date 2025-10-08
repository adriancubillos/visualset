// test/setup.ts
import { vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import type { Mock } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Polyfill ResizeObserver for Headless UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Provide a lightweight NextResponse mock that returns a plain object
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: (body: unknown, opts?: { status?: number }) => ({ body, opts }),
    },
  };
});

// Shared in-memory Prisma mock placed on globalThis for test files to use
type MockFn = Mock & { mockReset: () => void };

type PrismaMock = {
  task: {
    findMany: MockFn;
    create: MockFn;
    findUnique: MockFn;
    update: MockFn;
    delete: MockFn;
    count: MockFn;
  };
  item: {
    findMany: MockFn;
    findFirst: MockFn;
    create: MockFn;
    findUnique: MockFn;
    update: MockFn;
    delete: MockFn;
  };
  project: {
    findMany: MockFn;
    create: MockFn;
    findFirst: MockFn;
    findUnique: MockFn;
    update: MockFn;
    delete: MockFn;
  };
  configuration: {
    findMany: MockFn;
    create: MockFn;
    findUnique: MockFn;
    update: MockFn;
    delete: MockFn;
  };
  machine: {
    findMany: MockFn;
    create: MockFn;
    findUnique: MockFn;
    update: MockFn;
    delete: MockFn;
  };
  operator: {
    findMany: MockFn;
    create: MockFn;
    findUnique: MockFn;
    update: MockFn;
    delete: MockFn;
  };
  taskTimeSlot: {
    findMany: MockFn;
    create: MockFn;
    createMany: MockFn;
    deleteMany: MockFn;
  };
  taskMachine: {
    create: MockFn;
    createMany: MockFn;
    deleteMany: MockFn;
    count: MockFn;
  };
  taskOperator: {
    create: MockFn;
    createMany: MockFn;
    deleteMany: MockFn;
    count: MockFn;
  };
  $transaction: MockFn;
};

function makeMockPrisma(): PrismaMock {
  const makeMock = (): MockFn => {
    const m = vi.fn() as unknown as MockFn;
    m.mockReset = () => m.mockClear();
    return m;
  };

  const mock = {
    task: {
      findMany: makeMock(),
      create: makeMock(),
      findUnique: makeMock(),
      update: makeMock(),
      delete: makeMock(),
      count: makeMock(),
    },
    taskTimeSlot: {
      findMany: makeMock(),
      create: makeMock(),
      createMany: makeMock(),
      deleteMany: makeMock(),
    },
    taskMachine: {
      create: makeMock(),
      createMany: makeMock(),
      deleteMany: makeMock(),
      count: makeMock(),
    },
    taskOperator: {
      create: makeMock(),
      createMany: makeMock(),
      deleteMany: makeMock(),
      count: makeMock(),
    },
    item: {
      findMany: makeMock(),
      findFirst: makeMock(),
      create: makeMock(),
      findUnique: makeMock(),
      update: makeMock(),
      delete: makeMock(),
    },
    project: {
      findMany: makeMock(),
      create: makeMock(),
      findFirst: makeMock(),
      findUnique: makeMock(),
      update: makeMock(),
      delete: makeMock(),
    },
    configuration: {
      findMany: makeMock(),
      create: makeMock(),
      findUnique: makeMock(),
      update: makeMock(),
      delete: makeMock(),
    },
    machine: {
      findMany: makeMock(),
      create: makeMock(),
      findUnique: makeMock(),
      update: makeMock(),
      delete: makeMock(),
    },
    operator: {
      findMany: makeMock(),
      create: makeMock(),
      findUnique: makeMock(),
      update: makeMock(),
      delete: makeMock(),
    },
    $transaction: makeMock(),
  };

  // Setup $transaction to execute callback with the mock itself
  mock.$transaction.mockImplementation(async (callback: (tx: PrismaMock) => Promise<unknown>) => {
    return callback(mock);
  });

  return mock;
}

declare global {
  // make the typed prismaMock available on globalThis for setup and tests
  var prismaMock: PrismaMock | undefined;
}

if (!globalThis.prismaMock) {
  globalThis.prismaMock = makeMockPrisma();
}

export const prismaMock: PrismaMock = globalThis.prismaMock as PrismaMock;

// Mock PrismaClient to return our prismaMock when instantiated
vi.mock('@prisma/client', async () => {
  const actual = await vi.importActual('@prisma/client');
  const PrismaClientMock = function () {
    return globalThis.prismaMock as unknown as PrismaClient;
  } as unknown as typeof PrismaClient;
  return {
    ...actual,
    PrismaClient: PrismaClientMock,
  };
});
