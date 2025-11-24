# GitHub Personal Access Token 생성 가이드

## 빠른 가이드

### 1. GitHub 로그인
https://github.com 에 로그인

### 2. 토큰 생성 페이지로 이동
직접 링크: https://github.com/settings/tokens

또는:
1. 우측 상단 프로필 아이콘 클릭
2. **Settings** 클릭
3. 좌측 메뉴 맨 아래 **Developer settings** 클릭
4. **Personal access tokens** → **Tokens (classic)** 클릭
5. **Generate new token (classic)** 클릭

### 3. 토큰 설정

**Note (이름):**
```
GDGoC Test
```

**Expiration (만료 기간):**
- 테스트용: `30 days`
- 개발용: `90 days`
- 프로덕션: `No expiration` (주의 필요)

**Scopes (권한):**
필수:
- ✅ `read:user` - 사용자 정보 읽기

선택:
- ✅ `user:email` - 이메일 정보 읽기

### 4. 토큰 생성 및 복사

1. **Generate token** 버튼 클릭
2. GitHub 비밀번호 입력 (필요시)
3. 생성된 토큰 복사
   - 형식: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ **한 번만 표시되므로 즉시 복사하세요!**

### 5. 토큰 사용

```bash
# 테스트 스크립트 사용
./test-login.sh ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 또는 curl로 직접 테스트
curl -X POST http://localhost:5001/gdgoc-web/us-central1/loginWithGitHub \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}'
```

## 주의사항

- 🔒 토큰은 비밀번호처럼 다뤄야 합니다
- 🚫 토큰을 GitHub에 커밋하지 마세요
- ⏰ 만료되면 새로 생성해야 합니다
- 🔄 토큰을 잃어버리면 재생성해야 합니다

## 토큰 관리

### 토큰 목록 확인
https://github.com/settings/tokens

### 토큰 삭제
1. 토큰 목록에서 해당 토큰 찾기
2. **Delete** 또는 **Revoke** 클릭

### 토큰 재생성
기존 토큰과 동일한 설정으로 새 토큰 생성

