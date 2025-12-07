# 감사/운영 Runbook

## 1) 환경 확인
- `.env`에 `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` 존재 확인. 증빙: `src/services/tokenService.ts:11-50`.
- GitHub 로그인 일시 중단 플래그(`env.disableGithubLogin`) 상태 확인. 증빙: `src/controllers/v2/authController.ts:10-34`.
- Cloud Run/에뮬레이터 환경에서 trust proxy 활성 여부 확인. 증빙: `src/index.ts:168-182`.

## 2) 인증·세션 점검
- `/v2/auth/login/github` 호출 시 Access/Refresh 발급 및 세션 문서 생성 여부 확인. 증빙: `src/controllers/v2/authController.ts:10-34`, `src/services/authService.ts:228-266`, `src/repositories/sessionRepo.ts:15-47`.
- `/v2/auth/refresh`로 회전 시 기존 세션 `rotatedAt`/`replacedBy` 반영 및 reuse 차단 확인. 증빙: `src/services/authService.ts:269-339`.
- `/v2/auth/logout`에서 all/특정/current SID 시나리오별 세션 폐기 확인. 증빙: `src/controllers/v2/authController.ts:55-104`.

## 3) 인가 및 리소스 접근
- JWT 누락/만료/변조 시 401, 역할 불충족 시 403 반환 확인. 증빙: `src/middleware/authMiddleware.ts:12-53`, `src/middleware/requireRole.ts:5-35`.
- 이미지 업로드/수정/삭제는 MEMBER 이상, private 조회는 업로더/ADMIN만 허용되는지 확인. 증빙: `src/routes/v2/imageRoutes.ts:14-23`, `src/services/imageService.ts:66-159`.
- ADMIN 멤버 관리/링크 코드 재발급 접근 제어 확인. 증빙: `src/routes/v2/adminMemberRoutes.ts:9-13`, `src/services/memberService.ts:271-282`.

## 4) 데이터 보호
- Refresh 토큰/링크 코드/리크루트 비밀번호가 해시로 저장되는지 확인. 증빙: `src/services/tokenService.ts:40-50`, `src/repositories/memberRepository.ts:174-190`, `src/controllers/recruitController.ts:265-300`.
- Recruit 세션 만료/삭제 동작 확인. 증빙: `src/middleware/recruitAuthMiddleware.ts:44-56`.
- 이미지 scope 및 서명 URL 재발급 동작 확인. 증빙: `src/services/imageService.ts:69-177`.

## 5) 리크루트 흐름
- 지원서 제출 시 필수 필드 검증/중복 차단 확인. 증빙: `src/controllers/recruitController.ts:123-214`.
- 로그인 실패 누적 → 423 잠금 및 임시 비밀번호 메일 큐 적재 확인. 증빙: `src/controllers/recruitController.ts:216-300`.
- `/v2/recruit/me` 조회/수정 시 세션 갱신 및 민감 정보 마스킹 확인. 증빙: `src/controllers/recruitController.ts:302-447`.

## 6) 증빙 검증
- 문서 변경 후 `npm run audit:verify` 실행해 모든 `file:line` 링크 유효성 검사 (테스트 실행은 금지). 스크립트: `src/scripts/verify-audit-evidence.mts`.
