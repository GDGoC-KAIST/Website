# 빠른 테스트 가이드

## GitHub 토큰으로 로그인 테스트

### 방법 1: 테스트 스크립트 사용 (가장 안전) ⭐

```bash
cd backend
./test-login.sh ghp_your_token_here
```

스크립트가 자동으로 JSON 형식을 올바르게 처리합니다.

### 방법 2: curl 직접 사용

**⚠️ 중요: 토큰을 반드시 따옴표로 감싸세요!**

```bash
# 올바른 방법
curl -X POST http://localhost:5001/gdgoc-web/us-central1/loginWithGitHub \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "ghp_your_token_here"}'
```

**❌ 잘못된 방법 (에러 발생):**
```bash
# 토큰을 따옴표로 감싸지 않으면 JSON 파싱 에러 발생
curl -X POST http://localhost:5001/gdgoc-web/us-central1/loginWithGitHub \
  -H "Content-Type: application/json" \
  -d '{"accessToken": ghp_your_token_here}'  # ❌ 에러!
```

### 방법 3: Swagger UI 사용

1. 브라우저에서 열기: http://localhost:5001/gdgoc-web/us-central1/apiDocs
2. `/us-central1/loginWithGitHub` 찾기
3. **Try it out** 클릭
4. Request body에 입력:
   ```json
   {
     "accessToken": "ghp_your_token_here"
   }
   ```
5. **Execute** 클릭

## 이메일 발송 테스트

```bash
cd backend
./test-email.sh ghp_your_token_here
```

## 자주 발생하는 에러

### 1. JSON 파싱 에러
```
SyntaxError: Unexpected token 'g', ..."accessToken": ghp_...
```

**원인:** 토큰을 따옴표로 감싸지 않음

**해결:** 토큰을 따옴표로 감싸기
```bash
-d '{"accessToken": "ghp_your_token_here"}'  # ✅ 올바름
```

### 2. 토큰이 유효하지 않음
```
Failed to fetch GitHub user
```

**원인:** 
- 토큰이 만료됨
- 토큰 권한 부족 (read:user 필요)
- 토큰이 잘못됨

**해결:** 새 토큰 생성 (https://github.com/settings/tokens)

### 3. 에뮬레이터가 실행되지 않음
```
Connection refused
```

**해결:** 에뮬레이터 실행
```bash
cd backend
npx firebase emulators:start
```

