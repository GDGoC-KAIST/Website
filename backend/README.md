# 백엔드 시작 가이드

이 문서는 프로젝트를 처음 시작하는 팀원을 위한 가이드입니다.

## 빠른 시작

### 1. 저장소 클론 및 이동

```bash
git clone <repository-url>
cd Website/backend
```

### 2. 의존성 설치

```bash
# 백엔드 루트 의존성 설치
npm install

# Functions 의존성 설치
cd functions
npm install
cd ..
```

### 3. Functions 빌드

TypeScript로 작성된 Functions를 JavaScript로 빌드해야 합니다:

```bash
cd functions
npm run build
cd ..
```

**중요:** 에뮬레이터를 실행하기 전에 반드시 빌드를 해야 합니다!

### 4. Firebase 로그인

```bash
npx firebase login
```

브라우저가 열리면 Firebase 계정으로 로그인하세요.

**중요:** `firebase init`은 실행하지 마세요! 프로젝트 설정 파일(`.firebaserc`, `firebase.json`)이 이미 포함되어 있습니다.

### 5. 에뮬레이터 실행

```bash
npx firebase emulators:start
```

또는 npm 스크립트 사용:

```bash
npm run firebase:emulators
```

### 6. 접속 URL

에뮬레이터 실행 후 다음 URL로 접속할 수 있습니다:

- **Functions**: `http://localhost:5001`
- **Emulator UI**: `http://localhost:4000`
- **Swagger UI (API 테스트)**: `http://localhost:5001/website-7ee8f/us-central1/apiDocs`

## 문제 해결

### Firebase 로그인이 안 될 때

```bash
# 로그아웃 후 다시 로그인
npx firebase logout
npx firebase login
```

### 에뮬레이터가 실행되지 않을 때

```bash
# 포트가 이미 사용 중인 경우
# 다른 프로세스 종료 또는 firebase.json에서 포트 변경
```

### Functions가 로딩되지 않을 때

Functions가 로딩되지 않는다면 빌드가 안 되어 있을 가능성이 높습니다:

```bash
cd functions
npm run build
cd ..
```

빌드 후 에뮬레이터를 다시 시작하세요.

## 다음 단계

- API 테스트: Swagger UI에서 API 문서 확인
- 로그인 테스트: `test-login.sh` 스크립트 사용
- 이메일 테스트: `test-email.sh` 스크립트 사용


