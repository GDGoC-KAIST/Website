# 이메일 발송 확인 가이드

## 1. 에뮬레이터 로그 확인

에뮬레이터 콘솔에서 다음 로그를 찾아보세요:

### 환경 변수 확인 로그
```
Email sending attempt {
  hasEmailUser: true/false,
  emailUser: "you***",
  hasEmailPassword: true/false,
  ...
}
```

### 이메일 발송 시도 로그
```
Attempting to send email via SMTP {
  host: "smtp.gmail.com",
  port: 587,
  from: "your-email@gmail.com",
  to: "admin@example.com"
}
```

### 성공 로그
```
Email sent successfully {
  to: "admin@example.com",
  subject: "[GDGoC] 새로운 가입 요청: ...",
  messageId: "...",
  response: "250 2.0.0 OK ..."
}
```

### 실패 로그
```
Failed to send email {
  error: "...",
  stack: "..."
}
```

## 2. 테스트 이메일 API 사용

이메일 발송 기능을 직접 테스트:

```bash
curl -X POST http://localhost:5001/gdgoc-web/us-central1/testEmail \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

**성공 응답:**
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "to": "your-email@example.com"
}
```

**실패 응답:**
```json
{
  "error": "Failed to send test email",
  "message": "에러 메시지..."
}
```

## 3. .env 파일 확인

```bash
cd backend/functions
cat .env
```

다음이 설정되어 있어야 합니다:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@example.com
```

## 4. 일반적인 문제 해결

### 문제 1: 환경 변수가 로드되지 않음
- `.env` 파일이 `backend/functions/` 디렉토리에 있는지 확인
- 에뮬레이터 재시작 필요

### 문제 2: Gmail 인증 실패
- 앱 비밀번호 사용 (일반 비밀번호 아님)
- 2단계 인증 활성화 필요
- "보안 수준이 낮은 앱 액세스" 허용 (필요시)

### 문제 3: SMTP 연결 실패
- 방화벽/네트워크 문제
- Gmail SMTP 포트 차단

## 5. 로그 확인 명령어

에뮬레이터가 실행 중인 터미널에서 로그를 확인하세요.
또는 Firebase Emulator UI에서 Functions 로그 확인:
http://localhost:4000

