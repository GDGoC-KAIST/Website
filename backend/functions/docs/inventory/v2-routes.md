# V2 라우트 인벤토리

| Method | Endpoint | Handler | OpenAPI (O/X) | Tests (O/X) | 비고 |
| --- | --- | --- | --- | --- | --- |
| GET | /v2/docs | serveSwaggerUi | O | O | 작성 완료 |
| GET | /v2/openapi.json | serveOpenApiJson | O | O | 작성 완료 |
| GET | /v2/healthz | healthRouter | X | X | 미구현 - PR-D4 예정 |
| POST | /v2/auth/login/github | loginGithub | O | O | 작성 완료 |
| POST | /v2/auth/refresh | refresh | O | O | 작성 완료 |
| POST | /v2/auth/logout | logout | O | O | 로그 모니터링 필요 |
| GET | /v2/users/me | getMe | O | O | 작성 완료 |
| PATCH | /v2/users/me | patchMe | O | X | 테스트 누락 |
| POST | /v2/users/link-member | linkMember | O | O | 작성 완료 |
| POST | /v2/posts | createPost | O | O | 작성 완료 |
| GET | /v2/posts | listPosts | O | O | 작성 완료 |
| GET | /v2/posts/:postId | getPost | O | O | 작성 완료 |
| PATCH | /v2/posts/:postId | updatePost | O | O | 작성 완료 |
| DELETE | /v2/posts/:postId | deletePost | O | O | 작성 완료 |
| POST | /v2/comments | createComment | O | O | 작성 완료 |
| GET | /v2/comments | listComments | O | O | 작성 완료 |
| DELETE | /v2/comments/:commentId | deleteComment | O | O | 작성 완료 |
| POST | /v2/likes/toggle | toggleLike | O | O | 작성 완료 |
| POST | /v2/images | uploadImage | O | X | 이미지 계약/테스트 보강 필요 |
| GET | /v2/images | listImages | O | X | 일부 계약 테스트 누락 |
| GET | /v2/images/:imageId | getImage | O | X | 일부 계약 테스트 누락 |
| PATCH | /v2/images/:imageId | updateImage | O | X | 일부 계약 테스트 누락 |
| DELETE | /v2/images/:imageId | deleteImage | O | X | 일부 계약 테스트 누락 |
| POST | /v2/recruit/applications | apply | O | O | 작성 완료 |
| POST | /v2/recruit/login | login | O | O | 작성 완료 |
| GET | /v2/recruit/me | me | O | O | 작성 완료 |
| PATCH | /v2/recruit/me | updateMe | O | O | 작성 완료 |
| POST | /v2/recruit/reset-password | resetPassword | O | O | 작성 완료 |
| GET | /v2/recruit/config | config | O | O | 작성 완료 |
| POST | /v2/admin/members | createMember | O | O | 작성 완료 |
| POST | /v2/admin/members/:memberId/reset-link-code | resetLinkCode | O | X | 테스트 누락 |
| GET | /v2/admin/recruit/applications | listRecruitApplications | O | X | 별도 커버 필요 |
| PATCH | /v2/admin/recruit/applications/:applicationId/status | updateRecruitApplicationStatus | O | X | 별도 커버 필요 |
| GET | /v2/admin/recruit/config | getRecruitConfig | O | X | 별도 커버 필요 |
| PATCH | /v2/admin/recruit/config | updateRecruitConfig | O | X | 별도 커버 필요 |
| POST | /v2/admin/migrations/run | runMigration | O | X | 스펙/테스트 보강 필요 |

추가 이벤트:
- 이미지 API는 업로드/삭제 중심으로 계약 테스트를 보강해야 함
- Healthz/관리자 라우트 등 미커버 영역은 PR-D4 계획에 따라 단계적으로 보완함
