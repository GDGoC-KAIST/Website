# GitHub OAuth 설정 가이드

## 1. GitHub OAuth App 생성

1. https://github.com/settings/developers 접속
2. **OAuth Apps** → **New OAuth App** 클릭
3. 다음 정보 입력:
   - **Application name**: `GDG on Campus KAIST`
   - **Homepage URL**: 
     - 로컬: `http://localhost:3000`
     - 프로덕션: 실제 웹사이트 URL
   - **Authorization callback URL**: 
     - 로컬: `http://localhost:3000/login/callback`
     - 프로덕션: `https://yourdomain.com/login/callback`
4. **Register application** 클릭
5. **Client ID** 복사
6. **Generate a new client secret** 클릭하여 **Client secret** 생성 및 복사
   - ⚠️ Client secret은 한 번만 표시되므로 즉시 복사!

## 2. 환경 변수 설정

### 백엔드

Firebase Functions 환경 변수 설정:

```bash
firebase functions:config:set \
  github.client_id="YOUR_GITHUB_CLIENT_ID" \
  github.client_secret="YOUR_GITHUB_CLIENT_SECRET"
```

### 프론트엔드

`frontend/.env.local` 파일 생성:

```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id_here
```

## 3. 보안 주의사항

- ⚠️ **Client Secret은 절대 프론트엔드에 포함하지 마세요!**
- ⚠️ **공개 저장소에 커밋하지 마세요!**
- ✅ Client Secret은 백엔드 환경 변수로만 관리

