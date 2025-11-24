# Firebase Backend

Firebase 기반 백엔드 프로젝트입니다.

## 초기 설정

### 1. 의존성 설치

```bash
cd backend
npm install
```

### 2. 환경 변수 설정 (.env 파일)

이메일 발송 기능을 사용하려면 `.env` 파일이 필요합니다:

**경로:** `backend/functions/lib/.env`

`backend/functions/lib/.env` 파일을 만들고 다음 내용을 작성하세요:

```bash
# 이메일 발송 설정
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=your-admin@example.com

# 선택사항: 다른 SMTP 서비스 사용 시
# EMAIL_HOST=smtp.example.com
# EMAIL_PORT=587
```

**중요:**
- `EMAIL_PASSWORD`는 Gmail 앱 비밀번호를 사용해야 합니다 (일반 비밀번호 불가)
- 앱 비밀번호 생성: https://myaccount.google.com/apppasswords
- `.env` 파일은 Git에 커밋되지 않습니다 (`.gitignore`에 포함됨)

### 3. Firebase 로그인

```bash
# npm run 사용
npm run firebase:login

# npx 사용
npx firebase login
```

### 4. Firebase 프로젝트 초기화

```bash
# npm run 사용
npm run firebase:init
# 또는 특정 기능만 초기화
npm run firebase:init -- functions

# npx 사용
npx firebase init
# 또는 특정 기능만 초기화
npx firebase init emulators
```

`firebase init` 명령어가 다음을 자동으로 생성합니다:
- `firebase.json` - Firebase 프로젝트 설정
- `.firebaserc` - Firebase 프로젝트 ID 설정
- `functions/` 디렉토리 및 필요한 파일들

초기화 과정에서:
- 사용할 Firebase 프로젝트 선택
- 언어 선택 (JavaScript 또는 TypeScript)
- ESLint 사용 여부
- 의존성 자동 설치 여부

를 선택할 수 있습니다.

## 개발

### 로컬 에뮬레이터 실행

```bash
# backend 디렉토리에서
cd backend

# 방법 1: npm run 스크립트 사용
npm run firebase:emulators

# 방법 2: npx로 직접 실행 (권장)
npx firebase emulators:start
```

실행 후 접속 가능한 URL:
- **Functions**: `http://localhost:5001`
- **Emulator UI**: `http://localhost:4000`
- **Swagger UI (API 테스트)**: `http://localhost:5001/gdgoc-web/us-central1/apiDocs`

## 로그인 기능 테스트

### 1. GitHub Personal Access Token 생성

**단계별 가이드:**

1. **GitHub에 로그인**
   - https://github.com 에 로그인

2. **Settings로 이동**
   - 우측 상단 프로필 아이콘 클릭 → **Settings**

3. **Developer settings 접근**
   - 좌측 메뉴 맨 아래 **Developer settings** 클릭
   - 또는 직접: https://github.com/settings/developers

4. **Personal access tokens 메뉴**
   - **Personal access tokens** → **Tokens (classic)** 클릭
   - 또는 직접: https://github.com/settings/tokens

5. **새 토큰 생성**
   - **Generate new token** → **Generate new token (classic)** 클릭
   - GitHub 비밀번호 입력 요청

6. **토큰 설정**
   - **Note**: `GDGoC Test` 또는 원하는 이름 입력
   - **Expiration**: 
     - `30 days` (테스트용)
     - `90 days` (개발용)
     - `No expiration` (프로덕션용, 주의 필요)
   - **Scopes**: 
     - ✅ `read:user` 체크 (필수 - 사용자 정보 읽기)
     - ✅ `user:email` 체크 (선택 - 이메일 정보 읽기)

7. **토큰 생성 및 복사**
   - **Generate token** 클릭
   - ⚠️ **중요**: 생성된 토큰은 한 번만 표시됩니다!
   - 토큰을 복사해서 안전한 곳에 저장하세요
   - 예: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**토큰 형식:**
- `ghp_`로 시작하는 긴 문자열
- 예: `ghp_1234567890abcdefghijklmnopqrstuvwxyz`

**주의사항:**
- 토큰을 잃어버리면 재생성해야 합니다
- 토큰은 비밀번호처럼 다뤄야 합니다 (공유하지 마세요)
- 만료되면 새로 생성해야 합니다

### 2. 테스트 방법

#### 방법 1: Swagger UI 사용 (권장)

1. 에뮬레이터 실행:
   ```bash
   npx firebase emulators:start
   ```

2. 브라우저에서 Swagger UI 열기:
   ```
   http://localhost:5001/gdgoc-web/us-central1/apiDocs
   ```

3. `/us-central1/loginWithGitHub` 엔드포인트 찾기

4. **Try it out** 클릭

5. Request body에 다음 입력:
   ```json
   {
     "accessToken": "YOUR_GITHUB_TOKEN_HERE"
   }
   ```

6. **Execute** 클릭

#### 방법 2: curl 사용

**⚠️ 중요: 토큰을 반드시 따옴표로 감싸세요!**

```bash
# 올바른 방법 (작은따옴표로 전체 JSON 감싸기)
curl -X POST http://localhost:5001/gdgoc-web/us-central1/loginWithGitHub \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "ghp_your_token_here"}'

# 또는 큰따옴표 사용 (이스케이프 필요)
curl -X POST http://localhost:5001/gdgoc-web/us-central1/loginWithGitHub \
  -H "Content-Type: application/json" \
  -d "{\"accessToken\": \"ghp_your_token_here\"}"
```

**❌ 잘못된 예시 (JSON 파싱 에러 발생):**
```bash
# 토큰을 따옴표로 감싸지 않으면 에러 발생
curl -X POST http://localhost:5001/gdgoc-web/us-central1/loginWithGitHub \
  -H "Content-Type: application/json" \
  -d '{"accessToken": ghp_your_token_here}'  # ❌ 에러!
```

#### 방법 3: 테스트 스크립트 사용

```bash
cd backend
chmod +x test-login.sh
./test-login.sh YOUR_GITHUB_TOKEN_HERE
```

### 3. 예상 응답

**신규 사용자 (회원가입):**
```json
{
  "user": {
    "id": "abc123",
    "githubId": "12345678",
    "githubUsername": "username",
    "email": "user@example.com",
    "name": "User Name",
    "profileImageUrl": "https://avatars.githubusercontent.com/...",
    "status": "pending",
    "isAdmin": false,
    "createdAt": {...},
    "updatedAt": {...}
  },
  "isNewUser": true,
  "message": "회원가입 신청이 완료되었습니다. 관리자 승인을 기다려주세요."
}
```

**기존 사용자 (로그인):**
```json
{
  "user": {
    "id": "abc123",
    "status": "approved",
    ...
  },
  "isNewUser": false,
  "message": "로그인 성공"
}
```

### 4. 추가 API 테스트

**사용자 정보 조회:**
```bash
curl "http://localhost:5001/gdgoc-web/us-central1/getUser?userId=USER_ID"
```

**승인 상태 확인:**
```bash
curl "http://localhost:5001/gdgoc-web/us-central1/checkApprovalStatus?userId=USER_ID"
```

**관리자 목록 조회:**
```bash
curl "http://localhost:5001/gdgoc-web/us-central1/getAdmins"
```

## 이메일 발송 설정

가입 요청 알림 및 승인/거부 결과 이메일을 발송하려면 이메일 설정이 필요합니다.

### Gmail 사용 (권장)

1. **Gmail 앱 비밀번호 생성:**
   - Google 계정 설정 → 보안 → 2단계 인증 활성화
   - 앱 비밀번호 생성: https://myaccount.google.com/apppasswords
   - 생성된 16자리 비밀번호 복사

2. **환경 변수 설정:**

   **로컬 개발 (에뮬레이터):**
   
   방법 1: `.env` 파일 사용 (권장)
   
   **경로:** `backend/functions/lib/.env`
   
   `backend/functions/lib/.env` 파일을 만들고 다음 내용을 작성하세요:
   
   ```bash
   # 이메일 발송 설정
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ADMIN_EMAIL=your-admin@example.com
   ```
   
   방법 2: 환경 변수 직접 export
   ```bash
   export EMAIL_USER="your-email@gmail.com"
   export EMAIL_PASSWORD="your-app-password"
   npx firebase emulators:start
   ```
   
   방법 3: 한 줄로 실행
   ```bash
   EMAIL_USER="your-email@gmail.com" EMAIL_PASSWORD="your-app-password" npx firebase emulators:start
   ```
   
   **참고:** 환경 변수를 설정하지 않으면 에뮬레이터에서는 로그만 출력되고 실제 이메일은 발송되지 않습니다.

   **프로덕션 배포:**
   ```bash
   # Firebase Functions 환경 변수 설정
   firebase functions:config:set \
     email.user="your-email@gmail.com" \
     email.password="your-app-password"
   
   # 또는 Firebase Console에서 설정:
   # Functions → Configuration → Environment variables
   ```

3. **환경 변수 이름:**
   - `EMAIL_USER`: 발신자 이메일 주소
   - `EMAIL_PASSWORD`: Gmail 앱 비밀번호 (또는 일반 비밀번호)
   - `EMAIL_HOST`: SMTP 호스트 (기본값: `smtp.gmail.com`)
   - `EMAIL_PORT`: SMTP 포트 (기본값: `587`)
   - `ADMIN_EMAIL`: 관리자 이메일 (가입 요청 알림을 받을 이메일)
     - 여러 이메일은 쉼표로 구분: `admin1@example.com,admin2@example.com`
     - 설정하지 않으면 멤버 컬렉션에서 `isAdmin=true`인 멤버들의 이메일 사용

### 다른 이메일 서비스 사용

**SendGrid, Mailgun 등:**
- 각 서비스의 SMTP 설정에 맞게 `EMAIL_HOST`와 `EMAIL_PORT`를 설정하세요.

### 이메일 발송 흐름

1. **가입 요청 시:**
   - 신규 사용자 가입 시 `isAdmin=true`인 모든 멤버에게 가입 요청 알림 이메일 발송
   - 이메일에는 승인/거부 링크 포함

2. **승인/거부 시:**
   - 관리자가 승인/거부하면 해당 사용자에게 결과 이메일 발송
   - 승인: "가입 승인 완료" 이메일
   - 거부: "가입 요청 거부" 이메일

## 이메일 발송 테스트

### 1. 사전 준비

1. **환경 변수 설정:**
   ```bash
   cd backend/functions
   cp .env.example .env
   # .env 파일 편집하여 EMAIL_USER와 EMAIL_PASSWORD 설정
   ```

2. **관리자 멤버 생성:**
   ```bash
   # 멤버 생성 API 호출 (isAdmin=true로 설정)
   curl -X POST http://localhost:5001/gdgoc-web/us-central1/createMember \
     -H "Content-Type: application/json" \
     -d '{
       "name": "관리자",
       "email": "admin@example.com",
       "department": "컴퓨터공학과",
       "githubUsername": "admin",
       "isAdmin": true
     }'
   ```

3. **에뮬레이터 실행:**
   ```bash
   cd backend
   npx firebase emulators:start
   ```

### 2. 테스트 방법

#### 방법 1: 테스트 스크립트 사용 (권장)

```bash
cd backend
chmod +x test-email.sh
./test-email.sh YOUR_GITHUB_TOKEN
```

이 스크립트는:
- 신규 사용자 가입 요청 생성
- 관리자에게 이메일 발송 확인
- 승인/거부 후 사용자에게 이메일 발송 확인

#### 방법 2: 수동 테스트

**1단계: 신규 사용자 가입 요청**
```bash
curl -X POST http://localhost:5001/gdgoc-web/us-central1/loginWithGitHub \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "YOUR_GITHUB_TOKEN"}'
```

**2단계: 관리자 이메일 확인**
- 관리자 이메일함에서 가입 요청 알림 확인
- 승인/거부 링크 클릭 또는 API 호출

**3단계: 승인/거부 (API 사용)**
```bash
# 승인
curl -X POST http://localhost:5001/gdgoc-web/us-central1/approveUser \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "adminId": "ADMIN_USER_ID"
  }'

# 거부
curl -X POST http://localhost:5001/gdgoc-web/us-central1/rejectUser \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "adminId": "ADMIN_USER_ID"
  }'
```

**4단계: 사용자 이메일 확인**
- 가입 요청한 사용자의 이메일함에서 승인/거부 결과 확인

### 3. 확인 사항

✅ **관리자 이메일:**
- 가입 요청 알림 수신
- 승인/거부 링크 포함
- 사용자 정보 (이름, 이메일, GitHub) 포함

✅ **사용자 이메일:**
- 승인 시: "가입 승인 완료" 이메일
- 거부 시: "가입 요청 거부" 이메일

✅ **로그 확인:**
- 에뮬레이터 콘솔에서 이메일 발송 로그 확인
- `Email sent successfully` 메시지 확인

## 이메일 발송 대상

### 1. 가입 요청 시 → 관리자에게 발송
- **발송 대상**: 
  - **우선순위 1**: 환경 변수 `ADMIN_EMAIL`에 설정된 이메일
  - **우선순위 2**: 멤버 컬렉션에서 `isAdmin=true`인 모든 관리자
- **이메일 주소**: 
  - 환경 변수 설정 시: `ADMIN_EMAIL` 값 (여러 이메일은 쉼표로 구분)
  - 환경 변수 미설정 시: 관리자 멤버의 `email` 필드
- **설정 방법**:
  ```bash
  # .env 파일에 추가
  ADMIN_EMAIL=your-admin@example.com
  
  # 또는 여러 이메일
  ADMIN_EMAIL=admin1@example.com,admin2@example.com
  ```
- **확인 방법**:
  ```bash
  curl http://localhost:5001/gdgoc-web/us-central1/getAdmins
  ```

### 2. 승인/거부 시 → 사용자에게 발송
- **발송 대상**: 가입 요청한 사용자
- **이메일 주소**: GitHub에서 가져온 사용자의 이메일
- **확인 방법**:
  ```bash
  curl "http://localhost:5001/gdgoc-web/us-central1/getUser?userId=USER_ID"
  ```

**자세한 내용:** `backend/EMAIL_FLOW.md` 참고

Functions만 실행하려면:
```bash
# npm run 사용
npm run firebase:emulators:functions

# npx 사용
npx firebase emulators:start --only functions
```

### 함수 배포

**주의:** Firebase Functions를 배포하려면 **Blaze (pay-as-you-go) 플랜**이 필요합니다.

1. Firebase Console에서 프로젝트를 Blaze 플랜으로 업그레이드:
   - https://console.firebase.google.com/project/[project-id]/usage/details

2. 배포 실행:
```bash
# npm run 사용
npm run firebase:deploy:functions  # Functions만 배포
npm run firebase:deploy             # 전체 배포

# npx 사용
npx firebase deploy --only functions  # Functions만 배포
npx firebase deploy                   # 전체 배포
```

**참고:** Blaze 플랜은 무료 할당량이 있어서 소규모 사용은 무료입니다.
- Functions: 월 200만 회 호출 무료
- Storage: 일 5GB 다운로드, 1GB 저장 무료
- Firestore: 일 50,000회 읽기, 20,000회 쓰기 무료

## 사용 가능한 명령어

### npm run 스크립트
- `npm run firebase` - Firebase CLI 직접 사용
- `npm run firebase:login` - Firebase 로그인
- `npm run firebase:init` - Firebase 프로젝트 초기화
- `npm run firebase:emulators` - 에뮬레이터 실행
- `npm run firebase:emulators:functions` - Functions 에뮬레이터만 실행
- `npm run firebase:deploy` - 전체 배포
- `npm run firebase:deploy:functions` - Functions만 배포

### npx 직접 사용 (권장)
- `npx firebase login` - Firebase 로그인
- `npx firebase init` - Firebase 프로젝트 초기화
- `npx firebase emulators:start` - 에뮬레이터 실행
- `npx firebase emulators:start --only functions` - Functions 에뮬레이터만 실행
- `npx firebase deploy` - 전체 배포
- `npx firebase deploy --only functions` - Functions만 배포

**참고:** `npx`를 사용하면 전역 설치 없이도 Firebase CLI를 사용할 수 있습니다.

## 참고

- Firebase Functions 문서: https://firebase.google.com/docs/functions
- Firebase CLI 문서: https://firebase.google.com/docs/cli
