# 엔드포인트 인벤토리

| 경로 | 메서드 | 인증/인가 | 주요 동작 | 증빙 |
| --- | --- | --- | --- | --- |
| `/v2/healthz` | GET | 없음 | 헬스 체크 | `src/routes/v2/index.ts:20-24` |
| `/v2/auth/login/github` | POST | 비인증 + rate limit | GitHub OAuth 로그인, 세션 발급 | `src/routes/v2/index.ts:25-33`, `src/controllers/v2/authController.ts:10-34` |
| `/v2/auth/refresh` | POST | Refresh 토큰 필요 | 세션 회전, 새 액세스 토큰 발급 | `src/routes/v2/authRoutes.ts:9-12`, `src/controllers/v2/authController.ts:36-53` |
| `/v2/auth/logout` | POST | JWT 필수 | 현재/지정/전체 세션 폐기 | `src/routes/v2/authRoutes.ts:12-13`, `src/controllers/v2/authController.ts:55-104` |
| `/v2/users/me` | GET | JWT 필수 | 내 프로필 조회 | `src/routes/v2/userRoutes.ts:8-9`, `src/controllers/v2/userController.ts:10-25` |
| `/v2/users/me` | PATCH | JWT 필수 | 이름/전화/학과/학번/프로필 이미지 수정 | `src/routes/v2/userRoutes.ts:8-9`, `src/controllers/v2/userController.ts:27-89` |
| `/v2/users/link-member` | POST | JWT 필수 | 링크 코드로 멤버 연결 | `src/routes/v2/userRoutes.ts:11-16`, `src/controllers/v2/userController.ts:91-108` |
| `/v2/admin/members` | POST | JWT + ADMIN | 멤버 생성 | `src/routes/v2/adminMemberRoutes.ts:9-13` |
| `/v2/admin/members/:memberId/reset-link-code` | POST | JWT + ADMIN | 링크 코드 재발급/만료 갱신 | `src/routes/v2/adminMemberRoutes.ts:9-13`, `src/services/memberService.ts:271-282` |
| `/v2/images` | POST | JWT + MEMBER/ADMIN | 이미지 업로드, scope 지정 | `src/routes/v2/imageRoutes.ts:16-23`, `src/services/imageService.ts:30-52` |
| `/v2/images` | GET | 선택적 JWT | scope 기반 목록 조회 | `src/routes/v2/imageRoutes.ts:17-23`, `src/services/imageService.ts:54-64` |
| `/v2/images/:imageId` | GET | 선택적 JWT | 단건 조회 + 가시성 가드 | `src/routes/v2/imageRoutes.ts:18-23`, `src/services/imageService.ts:66-73` |
| `/v2/images/:imageId` | PATCH | JWT + 업로더/ADMIN | 이름/설명/scope 수정 | `src/routes/v2/imageRoutes.ts:19-23`, `src/services/imageService.ts:75-110` |
| `/v2/images/:imageId` | DELETE | JWT + 업로더/ADMIN | 파일 삭제 및 문서 제거 | `src/routes/v2/imageRoutes.ts:20-23`, `src/services/imageService.ts:112-120` |
| `/v2/recruit/applications` | POST | 비인증 + rate limit | 지원서 접수, 중복 차단 | `src/routes/v2/recruitRoutes.ts:27-38`, `src/controllers/recruitController.ts:123-214` |
| `/v2/recruit/login` | POST | 비인증 + rate limit | 지원자 로그인, 실패 누적 잠금 | `src/routes/v2/recruitRoutes.ts:27-38`, `src/controllers/recruitController.ts:216-300` |
| `/v2/recruit/reset-password` | POST | 비인증 | 리크루트 비밀번호 재설정 메일 큐 | `src/routes/v2/recruitRoutes.ts:27-38`, `src/controllers/recruitController.ts:357-399` |
| `/v2/recruit/config` | GET | 비인증 | 모집 공지/기간 조회 | `src/routes/v2/recruitRoutes.ts:27-33`, `src/controllers/recruitController.ts:403-419` |
| `/v2/recruit/me` | GET | Recruit 토큰 | 내 지원서 조회 | `src/routes/v2/recruitRoutes.ts:33-38`, `src/controllers/recruitController.ts:422-447` |
| `/v2/recruit/me` | PATCH | Recruit 토큰 | 내 지원서 수정 | `src/routes/v2/recruitRoutes.ts:33-37`, `src/controllers/recruitController.ts:302-355` |
