# Firebase Backend

Firebase 기반 백엔드 프로젝트입니다.

## 초기 설정

### 1. 의존성 설치

```bash
cd backend
npm install
```

### 2. Firebase 로그인

```bash
# npm run 사용
npm run firebase:login

# npx 사용
npx firebase login
```

### 3. Firebase 프로젝트 초기화

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
