# 이미지 CRUD API 문서

Firebase Functions를 통한 이미지 CRUD API 사용 가이드입니다.

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

