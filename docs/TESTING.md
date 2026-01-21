# EMS Studio - Testing Guide

This guide explains how to run and write tests for the EMS Studio project.

---

## Overview

| Layer | Framework | Location | Command |
|-------|-----------|----------|---------|
| **Backend Unit** | Jest | `backend/src/**/*.spec.ts` | `npm run test` |
| **Backend E2E** | Jest + Supertest | `backend/test/*.e2e-spec.ts` | `npm run test:e2e` |
| **Frontend Unit** | Vitest | `frontend/src/**/*.test.{ts,tsx}` | `npm run test` |

---

## Backend Tests

### Unit Tests (230+ tests)

Located in `backend/src/modules/*/`:

```bash
cd backend

# Run all tests
npm run test

# Watch mode
npm run test:watch

# With coverage
npm run test:cov

# Run specific file
npm run test -- auth.service.spec
```

**Test Files:**
- `auth.service.spec.ts` - Authentication (32 tests)
- `sessions.service.spec.ts` - Scheduling (28 tests)
- `packages.service.spec.ts` - Package management (25 tests)
- `client-portal.service.spec.ts` - Client features (23 tests)
- Plus 10 more service test files...

### E2E Tests

Located in `backend/test/`:

```bash
# Requires running database
docker compose up -d db redis

# Run E2E tests
npm run test:e2e
```

**Test Files:**
- `auth.e2e-spec.ts` - Registration & login flow
- `sessions.e2e-spec.ts` - Booking & conflicts
- `packages.e2e-spec.ts` - Assignment & balance

---

## Frontend Tests

### Unit Tests (40+ tests)

Located in `frontend/src/`:

```bash
cd frontend

# Run once
npm run test:run

# Watch mode
npm run test

# With coverage
npm run test:coverage
```

**Test Files:**
- `services/__tests__/auth.service.test.ts`
- `services/__tests__/api.test.ts`
- `services/__tests__/sessions.service.test.ts`
- `components/common/__tests__/Modal.test.tsx`
- `components/common/__tests__/ConfirmDialog.test.tsx`

---

## Writing Tests

### Backend Service Test Example

```typescript
import { Test } from '@nestjs/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MyService],
    }).compile();

    service = module.get(MyService);
  });

  it('should do something', () => {
    expect(service.method()).toBe(expected);
  });
});
```

### Frontend Service Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { myService } from '../my.service';

describe('MyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });

    const result = await myService.getData();
    expect(result).toEqual({ data: 'test' });
  });
});
```

### Component Test Example

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should handle click', async () => {
    const onClick = vi.fn();
    render(<MyComponent onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

---

## Coverage Targets

| Layer | Current | Target |
|-------|---------|--------|
| Backend | ~80% | 80%+ |
| Frontend | ~40% | 60%+ |

---

## CI Integration

Tests can be run in CI with:

```yaml
# GitHub Actions example
- name: Backend Tests
  run: |
    cd backend
    npm ci
    npm run test:cov

- name: Frontend Tests
  run: |
    cd frontend
    npm ci
    npm run test:coverage
```
