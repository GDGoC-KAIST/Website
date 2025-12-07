# 컴플라이언스 보고서 (SSOT)

## 인증·인가 통제
- JWT 필수 경로에서 Bearer 토큰 누락/변조/만료 시 401/403 처리 후 `req.user` 주입. 증빙: `src/middleware/authMiddleware.ts:12-53`.
- 역할 기반 인가로 허용 역할 외 요청을 403으로 차단. 증빙: `src/middleware/requireRole.ts:5-35`.
- 선택적 인증 경로는 토큰 오류를 무시하고 비인증으로 계속. 증빙: `src/middleware/optionalAuth.ts:7-22`.

## 세션·토큰 보안
- Access Token HS256, 기본 만료 15분(`JWT_ACCESS_EXPIRY`). 증빙: `src/services/tokenService.ts:11-27`.
- Refresh Token 48바이트 랜덤 + 해시 저장, 만료 TTL 기본 30일. 증빙: `src/services/tokenService.ts:13-50`.
- 세션 회전 시 해시 불일치/재사용 감지 → 401 및 전체 세션 폐기. 증빙: `src/services/authService.ts:269-339`.
- 로그아웃 시 현재/지정/전체 세션 폐기 옵션 제공. 증빙: `src/controllers/v2/authController.ts:55-104`.

## 라우팅·공개/비공개 자원
- `/v2` 라우터는 문서·헬스 후 Auth/User/Admin/콘텐츠/Recruit 순서로 마운트하며 GitHub 로그인에 rate limit 적용. 증빙: `src/routes/v2/index.ts:20-70`.
- 이미지 업로드/수정/삭제는 인증+멤버 이상, 열람은 scope 기반 가시성 가드. 증빙: `src/routes/v2/imageRoutes.ts:14-23`, `src/services/imageService.ts:30-177`.
- Recruit 엔드포인트는 별도 세션 토큰을 검증, 보호 구간 이전에 공용 경로만 노출. 증빙: `src/routes/v2/recruitRoutes.ts:27-38`, `src/middleware/recruitAuthMiddleware.ts:13-74`.

## 데이터 보호·무결성
- 세션·링크 코드·리크루트 비밀번호는 해시 저장, 만료/사용 시 필드 삭제. 증빙: `src/services/tokenService.ts:40-50`, `src/repositories/memberRepository.ts:174-190`, `src/controllers/recruitController.ts:265-300`.
- 멤버 링크 코드 사용 시 중복/만료/이미 연결된 사용자 모두 차단. 증빙: `src/services/memberService.ts:192-226`.
- 이미지 문서는 storagePath만 저장하고 서명 URL 재발급으로 직접 노출 최소화. 증빙: `src/services/imageService.ts:69-177`.
- 요청 로거는 비밀번호·토큰·이메일·쿠키 등 민감 키를 재귀적으로 마스킹 후 로그에 기록해 PII 노출을 차단. 증빙: `src/utils/redact.ts:1-44`, `src/middleware/requestLogger.ts:1-53`.
- 이미지 업로드는 헤더 선검사로 5MB 초과 요청을 거부하고, Busboy 단계에서 MIME allowlist(JPEG/PNG/WEBP) 및 5MB 제한을 강제하며 코드형 에러를 반환. 증빙: `src/controllers/v2/imageController.ts:5-36`, `src/utils/storage.ts:5-86`.

## 감사·운영 가능성
- Express 앱에 요청 로거, CORS, JSON 파서, 에러 핸들러가 전역 적용. 증빙: `src/index.ts:168-198`.
- 세션에 IP/User-Agent 기록으로 보안 이벤트 추적 가능. 증빙: `src/repositories/sessionRepo.ts:15-80`.
