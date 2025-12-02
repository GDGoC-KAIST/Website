# GDGoC KAIST Backend API 문서

Firebase Functions를 통한 백엔드 API 사용 가이드입니다.

## 엔드포인트

배포 후 각 함수는 다음과 같은 URL로 접근할 수 있습니다:
- `https://[region]-[project-id].cloudfunctions.net/[function-name]`

## API 목록

### 1. 이미지 생성 (Create) - 파일 업로드 포함

**엔드포인트:** `POST /createImage`

**Content-Type:** `multipart/form-data`

**요청 필드:**
- `name` (필수): 이미지 이름
- `description` (선택): 이미지 설명
- `file` (필수): 이미지 파일

**주의:** 이 엔드포인트는 파일을 직접 받아서 Storage에 업로드하고 Firestore에 메타데이터를 저장합니다.

**응답:**
```json
{
  "id": "document-id",
  "name": "이미지 이름",
  "description": "이미지 설명",
  "url": "https://storage.googleapis.com/[bucket]/images/1234567890_image.jpg",
  "storagePath": "images/1234567890_image.jpg",
  "createdAt": {...},
  "updatedAt": {...}
}
```

### 2. 이미지 목록 조회 (Read All)

**엔드포인트:** `GET /getImages`

**쿼리 파라미터:**
- `limit` (선택): 반환할 최대 개수 (기본값: 50)
- `offset` (선택): 건너뛸 개수 (기본값: 0)

**예시:**
```
GET /getImages?limit=20&offset=0
```

**응답:**
```json
{
  "images": [
    {
      "id": "document-id",
      "name": "이미지 이름",
      "description": "이미지 설명",
      "url": "https://storage.googleapis.com/...",
      "storagePath": "images/1234567890_image.jpg",
      "createdAt": {...},
      "updatedAt": {...}
    }
  ],
  "total": 1
}
```

### 3. 단일 이미지 조회 (Read One)

**엔드포인트:** `GET /getImage/{imageId}`

**응답:**
```json
{
  "id": "document-id",
  "name": "이미지 이름",
  "description": "이미지 설명",
  "url": "https://storage.googleapis.com/...",
  "storagePath": "images/1234567890_image.jpg",
  "createdAt": {...},
  "updatedAt": {...}
}
```

### 4. 이미지 업데이트 (Update)

**엔드포인트:** `PUT /updateImage/{imageId}`

**요청 본문:**
```json
{
  "name": "수정된 이름",
  "description": "수정된 설명"
}
```

**응답:**
```json
{
  "id": "document-id",
  "name": "수정된 이름",
  "description": "수정된 설명",
  "url": "https://storage.googleapis.com/...",
  "storagePath": "images/1234567890_image.jpg",
  "createdAt": {...},
  "updatedAt": {...}
}
```

### 5. 이미지 삭제 (Delete)

**엔드포인트:** `DELETE /deleteImage/{imageId}`

**응답:**
```json
{
  "message": "Image deleted successfully",
  "id": "document-id"
}
```

### 6. 업로드 URL 생성

**엔드포인트:** `POST /getUploadUrl`

**요청 본문:**
```json
{
  "fileName": "my-image.jpg",
  "contentType": "image/jpeg"
}
```

**응답:**
```json
{
  "uploadUrl": "https://storage.googleapis.com/...",
  "storagePath": "images/1234567890_my-image.jpg",
  "expiresIn": 900000
}
```

## 사용 예시

### 1. 이미지 업로드 및 등록 (권장 방법)

```javascript
// FormData를 사용하여 파일과 메타데이터를 함께 전송
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('name', 'My Image');
formData.append('description', 'Image description');
formData.append('file', file);

const createResponse = await fetch('https://[region]-[project-id].cloudfunctions.net/createImage', {
  method: 'POST',
  body: formData
});

const result = await createResponse.json();
console.log('Image created:', result);
```

### 2. Signed URL을 사용한 업로드 (대용량 파일용)

```javascript
// 1. 업로드 URL 생성
const uploadUrlResponse = await fetch('https://[region]-[project-id].cloudfunctions.net/getUploadUrl', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: 'my-image.jpg',
    contentType: 'image/jpeg'
  })
});
const { uploadUrl, storagePath } = await uploadUrlResponse.json();

// 2. Storage에 이미지 업로드
const file = document.getElementById('fileInput').files[0];
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'image/jpeg' },
  body: file
});

// 3. Firestore에 메타데이터 저장 (별도 엔드포인트 필요)
// 또는 createImage를 사용하여 직접 업로드하는 방법 사용
```

### 2. 이미지 목록 조회

```javascript
const response = await fetch('https://[region]-[project-id].cloudfunctions.net/getImages?limit=10');
const { images } = await response.json();
console.log(images);
```

## 주의사항

1. **CORS**: 모든 엔드포인트는 CORS를 허용하도록 설정되어 있습니다 (`Access-Control-Allow-Origin: *`).
2. **인증**: 현재는 인증이 없습니다. 필요시 Firebase Authentication을 추가하세요.
3. **Storage 경로**: 이미지는 `images/` 폴더에 저장됩니다.
4. **Signed URL**: 업로드 URL은 15분 후 만료됩니다.

---

# 프로젝트 CRUD API 문서

동아리 프로젝트 아카이빙을 위한 CRUD API 사용 가이드입니다.

## API 목록

### 1. 프로젝트 생성 (Create) - Admin Only

**엔드포인트:** `POST /createProject`

**Content-Type:** `application/json`

**요청 본문:**
```json
{
  "adminId": "admin-user-id",
  "title": "프로젝트 제목",
  "summary": "프로젝트 한줄 설명",
  "description": "프로젝트 상세 설명 (선택)",
  "semester": "2024-2",
  "status": "ongoing",
  "githubUrl": "https://github.com/owner/repo",
  "demoUrl": "https://example.com",
  "thumbnailUrl": "https://storage.googleapis.com/...",
  "teamMembers": ["김철수", "이영희"],
  "techStack": ["React", "Firebase", "TypeScript"]
}
```

**필수 필드:**
- `adminId`: 관리자 ID (권한 검증용)
- `title`: 프로젝트 제목
- `summary`: 한줄 요약
- `semester`: 학기 (형식: `YYYY-1` 또는 `YYYY-2`, 예: `2024-2`)
- `status`: 상태 (`ongoing` 또는 `completed`)
- `teamMembers`: 팀원 배열
- `techStack`: 기술 스택 배열

**선택 필드:**
- `description`: 상세 설명
- `githubUrl`: GitHub 레포지토리 URL (제공 시 README 자동 가져오기)
- `demoUrl`: 데모 사이트 URL
- `thumbnailUrl`: 썸네일 이미지 URL

**응답:**
```json
{
  "id": "project-id",
  "title": "프로젝트 제목",
  "summary": "프로젝트 한줄 설명",
  "description": "프로젝트 상세 설명",
  "semester": "2024-2",
  "status": "ongoing",
  "githubUrl": "https://github.com/owner/repo",
  "readmeContent": "# README content...",
  "readmeFetchedAt": {...},
  "demoUrl": "https://example.com",
  "thumbnailUrl": "https://storage.googleapis.com/...",
  "teamMembers": ["김철수", "이영희"],
  "techStack": ["React", "Firebase", "TypeScript"],
  "createdAt": {...},
  "updatedAt": {...}
}
```

**에러 응답:**
- `400`: 필수 필드 누락 또는 잘못된 형식
- `403`: 관리자 권한 없음
- `500`: 서버 오류

---

### 2. 프로젝트 목록 조회 (Read All) - Public

**엔드포인트:** `GET /getProjects`

**쿼리 파라미터:**
- `limit` (선택): 반환할 최대 개수 (기본값: 20)
- `offset` (선택): 건너뛸 개수 (기본값: 0)
- `semester` (선택): 학기별 필터링 (예: `2024-2`)
- `status` (선택): 상태별 필터링 (`ongoing` 또는 `completed`)

**예시:**
```
GET /getProjects?limit=10&offset=0&semester=2024-2&status=ongoing
```

**응답:**
```json
{
  "projects": [
    {
      "id": "project-id",
      "title": "프로젝트 제목",
      "summary": "프로젝트 한줄 설명",
      "semester": "2024-2",
      "status": "ongoing",
      "thumbnailUrl": "https://...",
      "teamMembers": ["김철수", "이영희"],
      "techStack": ["React", "Firebase"],
      "createdAt": {...},
      "updatedAt": {...}
    }
  ],
  "total": 10
}
```

---

### 3. 단일 프로젝트 조회 (Read One) - Public

**엔드포인트:** `GET /getProject/{projectId}`

**응답:**
```json
{
  "id": "project-id",
  "title": "프로젝트 제목",
  "summary": "프로젝트 한줄 설명",
  "description": "프로젝트 상세 설명",
  "semester": "2024-2",
  "status": "completed",
  "githubUrl": "https://github.com/owner/repo",
  "readmeContent": "# README Markdown content...",
  "readmeFetchedAt": {...},
  "demoUrl": "https://example.com",
  "thumbnailUrl": "https://storage.googleapis.com/...",
  "teamMembers": ["김철수", "이영희"],
  "techStack": ["React", "Firebase", "TypeScript"],
  "createdAt": {...},
  "updatedAt": {...}
}
```

**에러 응답:**
- `404`: 프로젝트를 찾을 수 없음

---

### 4. 프로젝트 업데이트 (Update) - Admin Only

**엔드포인트:** `PUT /updateProject/{projectId}`

**Content-Type:** `application/json`

**요청 본문:**
```json
{
  "adminId": "admin-user-id",
  "title": "수정된 제목",
  "status": "completed",
  "description": "수정된 설명"
}
```

**참고:**
- 모든 필드가 선택 사항입니다 (변경하고 싶은 필드만 전송)
- `githubUrl`이 변경되면 README가 자동으로 다시 가져와집니다
- `adminId`는 필수입니다 (권한 검증용)

**응답:**
```json
{
  "id": "project-id",
  "title": "수정된 제목",
  "summary": "프로젝트 한줄 설명",
  "status": "completed",
  ...
}
```

**에러 응답:**
- `400`: 잘못된 필드 값
- `403`: 관리자 권한 없음
- `404`: 프로젝트를 찾을 수 없음
- `500`: 서버 오류

---

### 5. 프로젝트 삭제 (Delete) - Admin Only

**엔드포인트:** `DELETE /deleteProject/{projectId}`

**Content-Type:** `application/json`

**요청 본문:**
```json
{
  "adminId": "admin-user-id"
}
```

**응답:**
```json
{
  "message": "Project deleted successfully",
  "id": "project-id"
}
```

**에러 응답:**
- `403`: 관리자 권한 없음
- `404`: 프로젝트를 찾을 수 없음
- `500`: 서버 오류

---

### 6. README 수동 갱신 (Refresh) - Admin Only

**엔드포인트:** `POST /refreshProjectReadme/{projectId}`

**Content-Type:** `application/json`

**요청 본문:**
```json
{
  "adminId": "admin-user-id"
}
```

**응답:**
```json
{
  "message": "README refreshed successfully",
  "project": {
    "id": "project-id",
    "readmeContent": "# Updated README...",
    "readmeFetchedAt": {...},
    ...
  }
}
```

**에러 응답:**
- `403`: 관리자 권한 없음
- `404`: 프로젝트를 찾을 수 없음
- `500`: 서버 오류

---

## 사용 예시

### 1. 프로젝트 생성

```javascript
const response = await fetch('https://[region]-[project-id].cloudfunctions.net/createProject', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    adminId: 'your-admin-user-id',
    title: 'GDGoC 웹사이트',
    summary: 'GDGoC KAIST 공식 웹사이트 프로젝트',
    description: '동아리 소개, 프로젝트 아카이빙, 멤버 관리 기능을 제공하는 웹사이트',
    semester: '2024-2',
    status: 'ongoing',
    githubUrl: 'https://github.com/GDGoC-KAIST/Website',
    teamMembers: ['김철수', '이영희', '박지민'],
    techStack: ['Next.js', 'Firebase', 'TypeScript', 'Tailwind CSS']
  })
});

const project = await response.json();
console.log('Created project:', project);
```

### 2. 프로젝트 목록 조회 (진행 중인 프로젝트만)

```javascript
const response = await fetch(
  'https://[region]-[project-id].cloudfunctions.net/getProjects?status=ongoing&limit=10'
);
const { projects } = await response.json();
console.log('Ongoing projects:', projects);
```

### 3. 프로젝트 상태 완료로 변경

```javascript
const response = await fetch(
  `https://[region]-[project-id].cloudfunctions.net/updateProject/${projectId}`,
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminId: 'your-admin-user-id',
      status: 'completed'
    })
  }
);

const updatedProject = await response.json();
console.log('Updated project:', updatedProject);
```

---

## 프로젝트 API 주요 기능

### GitHub README 자동 가져오기 (Fail-Safe)
- `githubUrl`이 제공되면 자동으로 GitHub API를 통해 README를 가져옵니다
- GitHub API 실패 시에도 프로젝트 생성/수정이 정상적으로 진행됩니다 (Fail-Safe)
- README는 `readmeContent` 필드에 Markdown 형식으로 저장됩니다
- `readmeFetchedAt` 필드에 가져온 시간이 기록됩니다

### 학기별 필터링
- `semester` 필드는 `YYYY-1` 또는 `YYYY-2` 형식을 사용합니다
  - `2024-1`: 2024년 1학기 (봄)
  - `2024-2`: 2024년 2학기 (가을)
- 쿼리 파라미터로 특정 학기의 프로젝트만 조회할 수 있습니다

### 상태 관리
- `ongoing`: 진행 중인 프로젝트
- `completed`: 완료된 프로젝트

### 관리자 권한
- 프로젝트 생성, 수정, 삭제는 관리자만 가능합니다
- `adminId`를 통해 `users` 컬렉션에서 `isAdmin: true` 확인
- 권한이 없으면 `403 Forbidden` 응답

---

## 프로젝트 API 주의사항

1. **Semester 형식**: 반드시 `YYYY-1` 또는 `YYYY-2` 형식을 사용해야 합니다
2. **Status 값**: `ongoing` 또는 `completed`만 허용됩니다
3. **GitHub URL**: GitHub 레포지토리 URL이 아닌 경우 README 가져오기가 실패할 수 있습니다 (프로젝트 생성/수정은 정상 진행)
4. **관리자 권한**: 쓰기 작업(Create, Update, Delete)은 관리자 인증이 필요합니다
5. **공개 API**: 읽기 작업(Get, List)은 인증 없이 접근 가능합니다

