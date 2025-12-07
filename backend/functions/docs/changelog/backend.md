## PR1-3: Recruit V2 통합 테스트 및 시드 헬퍼

### 변경사항
- **Seed Helpers**: `tests/helpers/recruitSeed.ts` 생성
  - `seedRecruitSession()` - 세션 토큰 생성
  - `seedRecruitApplication()` - 지원서 데이터 생성
  - `seedRecruitConfig()` - 모집 설정 생성
  - `clearRecruitData()` - 테스트 데이터 정리
- **통합 테스트**: `tests/integration/v2-recruit.spec.ts` 포괄적 테스트 스위트
  - 6개 엔드포인트 정상 동작 검증
  - 인증 실패 케이스 (401, 토큰 누락/만료)
  - 비즈니스 로직 검증 (중복 지원, 계정 잠금, 필드 검증)
  - Legacy 에러 형식 호환성 검증 (`{error: string}`)
  - Rate Limiting 검증 (apply: 5/min, login: 20/min)
  - End-to-End 플로우 테스트 (apply → login → profile → update → reset)
- **Pre-flight Check**: OpenAPI 스키마 `kaistEmail` 필드명 일치 확인 완료

### 테스트 커버리지
- ✅ POST /v2/recruit/applications (7 tests)
- ✅ POST /v2/recruit/login (6 tests)
- ✅ GET /v2/recruit/me (4 tests)
- ✅ PATCH /v2/recruit/me (5 tests)
- ✅ POST /v2/recruit/reset-password (3 tests)
- ✅ GET /v2/recruit/config (4 tests)
- ✅ Legacy error format (1 test)
- ✅ Rate limiting (2 tests)
- ✅ End-to-end flow (1 test)

---

## PR1-2: OpenAPI 명세 Recruit V2 엔드포인트 등록

### 변경사항
- OpenAPI: Recruit V2 엔드포인트 6개 등록 (Legacy Contract 준수)
- OpenAPI: RecruitBearerAuth 보안 스키마 추가
- Contract Tests: Recruit 엔드포인트 존재 및 보안 설정 검증 테스트 추가
- Schemas: RecruitApplicationRequest, RecruitLoginRequest, RecruitSessionResponse, RecruitProfile, RecruitUpdateRequest, RecruitResetRequest, RecruitConfig 스키마 정의

### 엔드포인트 목록
- `POST /v2/recruit/applications` - 지원서 제출
- `POST /v2/recruit/login` - 지원자 로그인
- `GET /v2/recruit/me` - 내 지원서 조회 (인증 필요)
- `PATCH /v2/recruit/me` - 내 지원서 수정 (인증 필요)
- `POST /v2/recruit/reset-password` - 비밀번호 재설정 요청
- `GET /v2/recruit/config` - 모집 설정 조회 (Public)

---

## PR-D0: 문서 인벤토리 및 기본 구조 수립
