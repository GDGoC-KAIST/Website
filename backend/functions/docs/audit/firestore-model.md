# Firestore 데이터 모델

## users
- 필드: `id`, `githubId`, `githubUsername`, `email`, `name`, `githubProfileImageUrl`, `profileImageUrl?`, `roles[]`, `memberId?`, 타임스탬프.
- 역할 정규화로 기본 USER, 허용 값만 저장. 증빙: `src/repositories/userRepository.ts:98-117`.
- 조회/장식 시 display URL 계산. 증빙: `src/services/userService.ts:13-68`.

## sessions
- 필드: `id`, `userId`, `refreshTokenHash`, `createdAt`, `expiresAt`, `rotatedAt?`, `revokedAt?`, `replacedBy?`, `ip?`, `userAgent?`. 증빙: `src/types/session.ts:1-15`, `src/repositories/sessionRepo.ts:15-80`.
- 생성 시 Refresh 토큰 해시만 저장, TTL은 `JWT_REFRESH_EXPIRY`. 증빙: `src/services/tokenService.ts:11-50`.

## members
- 필드: `id`, `name`, `email?`, `studentId?`, `department?`, `githubUsername?`, `profileImageUrl?`, `generation?`, `role?`, `blogName?`, `blogDescription?`, `isAdmin?`, `userId?`, `linkCodeHash?`, `linkCodeExpiresAt?`, `linkCodeUsedAt?`, 타임스탬프. 증빙: `src/types/member.ts:1-23`, `src/repositories/memberRepository.ts:98-190`.
- 링크 코드 재발급 시 해시/만료 갱신 후 사용 시 삭제. 증빙: `src/services/memberService.ts:271-282`.

## images
- 필드: `id`, `storagePath`, `url`, `name`, `description?`, `uploaderUserId`, `scope(public|members|private)`, 타임스탬프. 증빙: `src/types/schema.ts:3-17`, `src/repositories/imageRepo.ts:12-76`.
- 권한: 업로더/ADMIN만 수정·삭제, 조회는 scope 가드. 증빙: `src/services/imageService.ts:66-159`.

## recruitSessions
- 필드: `token`, `email`, `createdAt`, `expiresAt`. 증빙: `src/controllers/recruitController.ts:53-87`, `src/middleware/recruitAuthMiddleware.ts:13-73`.
- 만료 시 삭제 후 401 처리. 증빙: `src/middleware/recruitAuthMiddleware.ts:44-56`.

## recruitApplications
- 필드: `id(email)`, `name`, `kaistEmail`, `googleEmail`, `phone`, `department`, `studentId`, `motivation`, `experience`, `wantsToDo`, `githubUsername?`, `portfolioUrl?`, `passwordHash`, `failedAttempts`, `lockedUntil?`, `status`, 타임스탬프. 증빙: `src/controllers/recruitController.ts:123-214`.
- 로그인 실패 누적/잠금/임시 비밀번호 로직 포함. 증빙: `src/controllers/recruitController.ts:216-300`.
