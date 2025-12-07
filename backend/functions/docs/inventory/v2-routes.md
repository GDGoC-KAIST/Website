# V2 라우트 인벤토리 (SSOT)

`src/routes/v2/index.ts`를 기준으로 실제 마운트된 라우터를 나열합니다. 세부 엔드포인트와 테스트/스펙 상태는 각 도메인 문서와 OpenAPI에서 관리합니다.

| Base Path | Router | 증빙 |
| --- | --- | --- |
| `/v2/docs`, `/v2/openapi.json` | `docsRouter` | `src/routes/v2/index.ts:20-23` |
| `/v2/healthz` | `healthRouter` | `src/routes/v2/index.ts:20-24` |
| `/v2/auth` | `authRouter` | `src/routes/v2/index.ts:31-33` |
| `/v2/users` | `userRouter` | `src/routes/v2/index.ts:35-37` |
| `/v2/admin/members` | `adminMemberRouter` | `src/routes/v2/index.ts:38-40` |
| `/v2/posts` | `postRouter` (GET 캐시 포함) | `src/routes/v2/index.ts:41-49` |
| `/v2/images` | `imageRouter` | `src/routes/v2/index.ts:51-53` |
| `/v2/comments` | `commentRouter` | `src/routes/v2/index.ts:54-56` |
| `/v2/likes` | `likeRouter` | `src/routes/v2/index.ts:57-59` |
| `/v2/galleries` | `galleryRouter` | `src/routes/v2/index.ts:60-62` |
| `/v2/recruit` | `recruitRouter` (공용 + 보호 구간) | `src/routes/v2/index.ts:63-65` |
| `/v2/admin/recruit` | `adminRecruitRouter` | `src/routes/v2/index.ts:66-67` |
| `/v2/admin/migrations` | `adminMigrationRouter` | `src/routes/v2/index.ts:69-70` |

유지 원칙
- 라우터 추가/삭제 시 이 표를 즉시 갱신하고, 증빙 라인 번호를 정확히 맞춥니다.
- 상세 엔드포인트/테스트 현황은 OpenAPI와 도메인별 문서에서 관리하며, 필요 시 여기에 링크를 추가합니다.
