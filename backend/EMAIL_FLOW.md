# 이메일 발송 흐름

## 이메일 발송 대상

### 1. 가입 요청 시 → 관리자에게 발송

**발송 대상:**
- 멤버 컬렉션에서 `isAdmin=true`인 **모든 관리자**에게 발송
- 관리자가 여러 명이면 모두에게 발송됨

**이메일 내용:**
- 제목: `[GDGoC] 새로운 가입 요청: {사용자 이름}`
- 내용:
  - 신규 사용자 정보 (이름, 이메일, GitHub)
  - 승인 링크
  - 거부 링크

**관리자 이메일 확인 방법:**
```bash
# 관리자 목록 조회
curl http://localhost:5001/gdgoc-web/us-central1/getAdmins

# 응답 예시:
{
  "admins": [
    {
      "id": "abc123",
      "name": "관리자",
      "email": "admin@example.com",  # ← 이 이메일로 발송됨
      "isAdmin": true
    }
  ],
  "count": 1
}
```

**관리자가 없을 경우:**
- 환경 변수 `ADMIN_EMAIL` 또는 기본값 `admin@gdgoc.kaist.ac.kr`로 발송

### 2. 승인/거부 시 → 사용자에게 발송

**발송 대상:**
- 가입 요청한 **사용자**에게 발송
- 사용자 이메일은 GitHub에서 가져온 이메일 주소

**이메일 내용:**

**승인 시:**
- 제목: `[GDGoC] 가입 승인 완료`
- 내용: "가입 요청이 승인되었습니다. 이제 로그인하여 서비스를 이용하실 수 있습니다."

**거부 시:**
- 제목: `[GDGoC] 가입 요청 거부`
- 내용: "가입 요청이 거부되었습니다. 추가 문의사항이 있으시면 관리자에게 연락해주세요."

**사용자 이메일 확인 방법:**
```bash
# 사용자 정보 조회
curl "http://localhost:5001/gdgoc-web/us-central1/getUser?userId=USER_ID"

# 응답 예시:
{
  "id": "user123",
  "email": "user@example.com",  # ← 이 이메일로 발송됨
  "name": "사용자",
  "status": "approved"
}
```

## 전체 흐름

```
1. 신규 사용자 가입 요청
   ↓
2. GitHub에서 사용자 정보 가져오기 (이메일 포함)
   ↓
3. 관리자들에게 가입 요청 알림 이메일 발송
   📧 → admin1@example.com
   📧 → admin2@example.com
   ↓
4. 관리자가 승인/거부
   ↓
5. 사용자에게 결과 이메일 발송
   📧 → user@example.com (승인/거부 결과)
```

## 확인 방법

### 관리자 이메일 확인
```bash
# 1. 관리자 목록 조회
curl http://localhost:5001/gdgoc-web/us-central1/getAdmins

# 2. 해당 이메일함 확인
```

### 사용자 이메일 확인
```bash
# 1. 사용자 정보 조회
curl "http://localhost:5001/gdgoc-web/us-central1/getUser?userId=USER_ID"

# 2. GitHub 프로필에서 이메일 확인
# 또는 사용자 이메일함 확인
```

## 주의사항

⚠️ **GitHub 이메일이 private인 경우:**
- GitHub API에서 이메일을 가져올 수 없을 수 있음
- 이 경우 이메일 발송이 실패할 수 있음
- 해결: GitHub 프로필에서 이메일을 public으로 설정

⚠️ **관리자가 없는 경우:**
- 환경 변수 `ADMIN_EMAIL`로 발송
- 또는 기본값 `admin@gdgoc.kaist.ac.kr`로 발송

