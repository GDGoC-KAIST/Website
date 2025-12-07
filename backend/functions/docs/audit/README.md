# Audit Documentation (SSOT)

이 폴더는 보안·컴플라이언스 감사 문서를 위한 단일 진실 공급원(SSOT)입니다. 모든 증빙은 `src/path/to/file.ts:line` 또는 `src/path/to/file.ts:start-end` 형식으로 실제 코드 라인에 연결됩니다.

- 수동 검증: `npm run audit:verify` 스크립트가 증빙 링크가 실제로 존재하고 올바른 라인 범위를 가리키는지 확인합니다.
- 유지 원칙: 코드 변경 시 여기에 있는 문서를 함께 업데이트하고, 증빙 라인도 최신 상태로 맞춥니다.
