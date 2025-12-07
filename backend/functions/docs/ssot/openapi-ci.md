# OpenAPI SSOT 및 CI 운영 가이드 (GDGoC KAIST Backend)

## 1. 문서의 목적 (Purpose)
- `openapi.json`은 경로, 스키마, 인증 스키마 등 모든 API 계약의 Single Source of Truth입니다.
- CI 파이프라인은 자동으로 스펙을 검증해 코드와 문서가 어긋나는 상황을 차단합니다.

## 2. 자동화 범위 (Automation Scope)
- **자동화**: 결정적(Deterministic) OpenAPI 생성(`scripts/print-openapi.ts`), PR OpenAPI Diff 보고(`.github/workflows/openapi-diff.yml`), SSOT Gate로 스펙 누락 차단.
- **수동**: PR 작성 및 코드 변경은 담당 개발자가 수행하며, 검증은 자동화가 담당합니다.

## 3. 로컬 개발 워크플로우 (Local Workflow)
1. `npm run openapi:print` – 현재 코드 상태의 스펙을 결정적인 JSON으로 생성합니다.
2. `npm run openapi:check` – 생성된 결과와 커밋된 `openapi.json`을 비교합니다.
3. 루틴: API 코드 변경 → `openapi:print` → `openapi:check` 통과 → 코드와 `openapi.json` 함께 커밋.

## 4. CI 파이프라인 동작 (CI Workflow)
- 워크플로: `.github/workflows/openapi-diff.yml`.
- 동작: PR 브랜치의 스펙과 기준 브랜치 스펙을 생성해 비교합니다.
- 결과: PR에 한국어로 요약 댓글을 남겨 리뷰어가 변경 범위를 즉시 확인할 수 있게 합니다.

## 5. SSOT Gate 동작 원리 (SSOT Gate)
- 스크립트: `scripts/ssot-gate.ts`.
- 로직: `src/routes/`, `src/controllers/`, `src/schemas/` 내 코드가 수정되고 `src/docs/openapi.ts`가 수정되지 않으면 실패합니다.
- 예외: 커밋 메시지에 `[skip-gate]`를 포함하면 일시적으로 통과하지만, 사후에 반드시 스펙을 보강해야 합니다.

## 6. 트러블슈팅 (Troubleshooting)
- **Diff 노이즈**: `openapi:print`는 JSON만 출력해야 하며, 콘솔 로그가 있다면 제거해야 합니다.
- **경로 오류**: `openapi:check`는 `backend/functions` 디렉터리에서 실행되므로 상대경로를 주의합니다.
- **ESM 경고**: `MODULE_TYPELESS_PACKAGE_JSON` 경고는 로더 설정으로 완화하며, 동작에 치명적인 영향을 주지 않습니다.

## 7. 팀 컨벤션 (Team Rules)
- 모든 API 코드 변경(PR)은 OpenAPI diff를 포함해야 합니다.
- 신규 엔드포인트는 OpenAPI 등록 + Contract Test + Integration Test(정상 시나리오)를 동반해야 합니다.

