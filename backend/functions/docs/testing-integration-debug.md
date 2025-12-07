# Integration Test Failures & Skipped Tests – Debug/Fix Guide

## 개요

Recruit V2 API 통합 테스트 중 일부 테스트가 실패하거나 스킵되는 현상에 대한 디버깅 가이드입니다.

## 문제 1: Rate Limit 테스트 실패 (423 Locked vs 429 Rate Limited)

### 현상
- `tests/integration/v2-recruit-ratelimit.spec.ts` 실행 시 예상치 못한 423 Locked 응답
- 429 Too Many Requests를 기대했으나 Account Lockout이 먼저 발생

### 근본 원인

**상태 공유 문제:**
- Rate Limit Store와 Account Lockout 로직이 동일한 이메일 주소를 공유
- `recruitApplications` 컬렉션에서 `failedAttempts` 카운터가 10회 초과 시 423 응답
- Rate Limit (429)보다 Account Lockout (423)이 먼저 트리거됨

**테스트 격리 실패:**
- 모든 Rate Limit 테스트가 동일한 이메일 (`test@kaist.ac.kr`) 사용
- `clearCollections()`가 컬렉션을 지우지만, 여러 요청이 연속으로 실행되면서 failedAttempts가 누적
- 5번의 Rate Limit 테스트 → 10번의 실패 → Account Lockout

### 해결 방법

#### 방법 1: 테스트별 고유 이메일 사용 (권장)

```typescript
it("should allow 5 requests and reject the 6th with 429", async () => {
  const uniqueEmail = `rate-limit-test-${Date.now()}-${Math.random()}@kaist.ac.kr`;

  // First 5 requests should succeed (201)
  for (let i = 0; i < 5; i++) {
    await request(app)
      .post("/v2/recruit/applications")
      .set("X-Forwarded-For", FIXED_IP)
      .send({...validApplication, kaistEmail: uniqueEmail})
      .expect(201);
  }

  // 6th request should be rate limited (429)
  const rateLimitedResponse = await request(app)
    .post("/v2/recruit/applications")
    .set("X-Forwarded-For", FIXED_IP)
    .send({...validApplication, kaistEmail: uniqueEmail})
    .expect(429);
});
```

**장점:**
- 완전한 테스트 격리
- Account Lockout 로직과 충돌 없음
- 병렬 테스트 실행 가능

#### 방법 2: Account Lockout 비활성화 (대안)

테스트 환경에서만 Account Lockout 임계값 증가:

```typescript
// src/controllers/recruitController.ts
const MAX_FAILED_ATTEMPTS = process.env.NODE_ENV === 'test' ? 1000 : 10;
```

**단점:**
- Account Lockout 기능 자체를 테스트하지 못함
- 프로덕션 로직과 테스트 로직이 달라짐

### 적용된 해결책

**고유 이메일 전략 채택:**
- 각 테스트 케이스마다 `Date.now()` + `Math.random()` 기반 고유 이메일 생성
- IP 기반 Rate Limiting 테스트는 이메일을 다르게 하되 IP는 고정
- 완전한 테스트 격리 보장

---

## 문제 2: IP 스푸핑이 작동하지 않음 (모든 요청이 127.0.0.1로 인식)

### 현상
- `X-Forwarded-For` 헤더를 설정해도 `req.ip`가 항상 127.0.0.1
- 다른 IP로 요청해도 Rate Limit이 공유됨

### 근본 원인

**Trust Proxy 미설정:**
- Express는 기본적으로 프록시를 신뢰하지 않음
- `app.set('trust proxy', true)` 설정 필요
- 설정 없이는 `X-Forwarded-For` 헤더 무시

### 해결 방법

#### 테스트 환경에서 Trust Proxy 활성화

**appFactory.ts (테스트 전용):**

```typescript
export function createTestApp(): express.Express {
  const app = express();

  // Enable trust proxy for test environment
  if (process.env.NODE_ENV === 'test' || process.env.FUNCTIONS_EMULATOR === 'true') {
    app.set('trust proxy', true);
  }

  app.use(corsMiddleware);
  app.use(express.json());
  app.use("/v2", v2Router);
  app.use(errorHandler);
  return app;
}
```

**src/index.ts (프로덕션):**

```typescript
const app = express();

// Trust proxy when behind Cloud Run / Firebase Hosting
if (process.env.K_SERVICE || process.env.FIREBASE_CONFIG) {
  app.set('trust proxy', true);
}
```

### 검증 방법

```typescript
it("should use different rate limit counters for different IPs", async () => {
  const IP_A = "192.168.1.100";
  const IP_B = "192.168.1.200";

  // IP_A: 5 requests (should succeed)
  for (let i = 0; i < 5; i++) {
    await request(app)
      .post("/v2/recruit/applications")
      .set("X-Forwarded-For", IP_A)
      .send({...validApplication, kaistEmail: `user-a-${i}@kaist.ac.kr`})
      .expect(201);
  }

  // IP_B: 5 requests (should succeed - different counter)
  for (let i = 0; i < 5; i++) {
    await request(app)
      .post("/v2/recruit/applications")
      .set("X-Forwarded-For", IP_B)
      .send({...validApplication, kaistEmail: `user-b-${i}@kaist.ac.kr`})
      .expect(201);
  }
});
```

---

## 문제 3: beforeEach 타임아웃 (5000ms 초과)

### 현상
```
Exceeded timeout of 5000 ms for a hook.
```

### 근본 원인

**Firebase Emulator 연결 실패:**
- Firestore Emulator가 실행되지 않은 상태
- `clearCollections()` 호출이 연결 대기로 타임아웃

### 해결 방법

#### 테스트 실행 전 Emulator 시작

```bash
# Terminal 1: Emulator 시작
cd backend
npx firebase emulators:start

# Terminal 2: 테스트 실행
cd backend/functions
npm run test:integration
```

#### Jest 타임아웃 증가 (임시 방편)

```typescript
// jest.config.js
module.exports = {
  testTimeout: 30000, // 30초
};
```

---

## 문제 4: Rate Limit Store Reset이 작동하지 않음

### 현상
- `recruitApplyStore.resetAll()` 호출 후에도 429 에러 지속

### 근본 원인

**잘못된 Store 인스턴스:**
- 테스트에서 import한 store와 실제 사용되는 store가 다름
- Middleware가 다른 store 인스턴스 참조

### 해결 방법

#### Store Export 및 일관된 사용

**src/routes/v2/recruitRoutes.ts:**

```typescript
// Export dedicated stores for testing
export const recruitApplyStore = new MemoryRateLimitStore();
export const recruitLoginStore = new MemoryRateLimitStore();

const applyLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  keyGenerator: (req) => req.ip || "unknown",
  store: recruitApplyStore, // Use exported store
});
```

**tests/integration/v2-recruit.spec.ts:**

```typescript
import {recruitApplyStore, recruitLoginStore} from "../../src/routes/v2/recruitRoutes";

beforeEach(async () => {
  await clearCollections(["recruitApplications", "recruitSessions", "recruitConfig"]);
  // Reset the SAME stores used in routes
  recruitApplyStore.resetAll();
  recruitLoginStore.resetAll();
});
```

---

## 문제 5: 403 Forbidden 로그 노이즈

### 현상
- 테스트 실행 중 대량의 "Recruit controller error {status:403}" 로그

### 근본 원인

**과도한 에러 로깅:**
- 모든 에러 (4xx 포함)를 `logger.error()`로 기록
- 클라이언트 에러는 예상된 동작이므로 로깅 불필요

### 해결 방법

#### 서버 에러만 로깅

```typescript
function handleControllerError(
  response: Response,
  error: unknown,
  defaultStatus = 500
): void {
  const status = (error as {status?: number})?.status ?? defaultStatus;
  const message = error instanceof Error ? error.message : "Unknown error";

  // Only log server errors (5xx), not client errors (4xx)
  if (status >= 500) {
    logger.error("Recruit controller error", {message, error, status});
  }

  response.status(status).json({error: message});
}
```

---

## 테스트 실행 체크리스트

### 사전 준비
- [ ] Firebase Emulator 실행 (`npx firebase emulators:start`)
- [ ] `.env.test` 파일 존재 확인
- [ ] `NODE_ENV=test` 환경 변수 설정

### 통합 테스트 실행
```bash
cd backend/functions

# 전체 통합 테스트
npm run test:integration

# 특정 파일만
npx jest tests/integration/v2-recruit.spec.ts --runInBand

# Rate Limit 테스트만
npx jest tests/integration/v2-recruit-ratelimit.spec.ts --runInBand
```

### 트러블슈팅
1. **ECONNREFUSED 에러**: Emulator 실행 확인
2. **429 대신 423 발생**: 고유 이메일 사용 확인
3. **IP가 127.0.0.1로 고정**: Trust proxy 설정 확인
4. **Store reset 안 됨**: Export된 store 인스턴스 사용 확인

---

## 권장 Best Practices

### 1. 테스트 격리
```typescript
// ❌ 나쁜 예: 공유 이메일
const testEmail = "test@kaist.ac.kr";

// ✅ 좋은 예: 고유 이메일
const testEmail = `test-${Date.now()}-${Math.random()}@kaist.ac.kr`;
```

### 2. 명확한 Assertion
```typescript
// ❌ 나쁜 예: 모호한 기대값
expect([401, 423]).toContain(res.status);

// ✅ 좋은 예: 명확한 분기
if (i < 10) {
  expect(res.status).toBe(401); // Still trying
} else {
  expect(res.status).toBe(423); // Locked
}
```

### 3. 환경 분리
```typescript
// Test environment
if (process.env.NODE_ENV === 'test') {
  app.set('trust proxy', true);
  // Disable rate limiting for most tests
  return next();
}

// Production environment
if (process.env.K_SERVICE) {
  app.set('trust proxy', true);
}
```

### 4. Store 관리
```typescript
// Export stores for test access
export const recruitApplyStore = new MemoryRateLimitStore();

// Reset in beforeEach
beforeEach(async () => {
  recruitApplyStore.resetAll();
  recruitLoginStore.resetAll();
});
```

---

## 요약

| 문제 | 원인 | 해결책 |
|------|------|--------|
| 423 instead of 429 | 이메일 공유로 Account Lockout 먼저 발생 | 테스트별 고유 이메일 사용 |
| IP 스푸핑 안 됨 | Trust proxy 미설정 | `app.set('trust proxy', true)` |
| beforeEach 타임아웃 | Emulator 미실행 | Emulator 시작 후 테스트 |
| Store reset 안 됨 | 다른 store 인스턴스 참조 | Export된 store 사용 |
| 403 로그 노이즈 | 모든 에러 로깅 | 5xx만 로깅 |

모든 수정 사항이 적용된 상태에서는 통합 테스트가 안정적으로 통과해야 합니다.
