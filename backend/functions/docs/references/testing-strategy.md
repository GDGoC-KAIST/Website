# 테스트 전략 (Testing Strategy)

- **Unit**: 개별 로직/모듈의 기능 검증
- **Integration**: 컨트롤러, 라우터, DB/외부 서비스 연결을 포함한 실제 동작 검증
- **Contract**: OpenAPI 스펙과 실제 응답이 일치하는지 검증 (계약 테스트)
- **Smoke**: Healthz 등 핵심 엔드포인트의 생존 여부를 빠르게 확인하는 최소 검증
