# Backend 2.0 - Auth Middleware & RBAC Implementation

## ✅ Phase 1 / Week 1 - Task 1 COMPLETED

This document describes the **Auth Middleware + RBAC Guards** implementation for the GDGoC KAIST Backend 2.0 project.

---

## 📁 File Structure

```
backend/functions/src/
├── types/
│   ├── auth.ts                    # JWT payload & Role definitions
│   └── express.d.ts               # Express Request type extension
├── utils/
│   └── appError.ts                # Custom error class
├── middleware/
│   ├── authMiddleware.ts          # JWT verification
│   ├── requireRole.ts             # RBAC guards
│   └── errorHandler.ts            # Global error handler
├── controllers/v2/
│   └── userController.ts          # Test controller (getMe)
├── routes/v2/
│   └── index.ts                   # V2 router
└── index.ts                       # Main entry (exports apiV2)
```

---

## 🔐 Authentication Flow

### 1. Token Payload Structure

```typescript
interface AccessTokenPayload {
  sub: string;          // userId (matches users/{id})
  roles: Role[];        // ["USER", "MEMBER", "ADMIN"]
  memberId?: string;    // present only if linked to members/{id}
  iat: number;          // issued at
  exp: number;          // expiration time
  sid: string;          // sessionId (matches sessions/{sid})
}
```

### 2. Role Hierarchy

```
PUBLIC (no auth)
  ↓
USER (GitHub login)
  ↓
MEMBER (linked to members collection)
  ↓
ADMIN (staff/operator)
```

---

## 🛡️ Middleware Usage

### Basic Authentication

Require any authenticated user:

```typescript
import { authMiddleware } from "../../middleware/authMiddleware";

router.get("/protected", authMiddleware, (req, res) => {
  // req.user is populated with AccessTokenPayload
  res.json({ user: req.user });
});
```

### Role-Based Access Control

```typescript
import { requireAuth, requireMember, requireAdmin } from "../../middleware/requireRole";

// Require any logged-in user (USER, MEMBER, or ADMIN)
router.post("/comments", requireAuth, createComment);

// Require MEMBER or ADMIN
router.post("/posts", requireMember, createPost);

// Require ADMIN only
router.post("/admin/members", requireAdmin, createMember);
```

### Custom Role Requirements

```typescript
import { requireRole } from "../../middleware/requireRole";

// Require specific roles
router.patch(
  "/special",
  requireRole(["MEMBER", "ADMIN"]),
  handleSpecial
);
```

---

## 🚨 Error Handling

### Standard Error Response (v2)

All errors return this exact structure:

```json
{
  "error": {
    "code": "UPPERCASE_ERROR_CODE",
    "message": "Human readable description"
  }
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing Authorization header |
| 401 | `TOKEN_EXPIRED` | Access token has expired |
| 401 | `INVALID_TOKEN` | Invalid JWT signature |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected error |

### Custom Errors

Use `AppError` class for throwing errors:

```typescript
import { AppError } from "../../utils/appError";

throw new AppError(
  404,
  "RESOURCE_NOT_FOUND",
  "The requested resource does not exist"
);
```

---

## 🧪 Testing

### 1. Setup Environment Variables

Create `backend/.env`:

```bash
JWT_SECRET=your_super_secret_key_at_least_32_characters_long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d
```

### 2. Generate Test JWT

Use this Node.js script to generate a test token:

```javascript
const jwt = require('jsonwebtoken');

const payload = {
  sub: "test-user-123",
  roles: ["USER", "MEMBER"],
  memberId: "member-456",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 900, // 15 min
  sid: "session-789"
};

const token = jwt.sign(payload, process.env.JWT_SECRET);
console.log("Access Token:", token);
```

### 3. Test the `/v2/users/me` Endpoint

Start the emulator:

```bash
cd backend
npm run serve
```

Make a test request:

```bash
curl -X GET http://localhost:5001/YOUR_PROJECT_ID/us-central1/apiV2/v2/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:

```json
{
  "user": {
    "sub": "test-user-123",
    "roles": ["USER", "MEMBER"],
    "memberId": "member-456",
    "iat": 1234567890,
    "exp": 1234568790,
    "sid": "session-789"
  }
}
```

### 4. Test Error Cases

**Missing token:**

```bash
curl -X GET http://localhost:5001/YOUR_PROJECT_ID/us-central1/apiV2/v2/users/me
```

Response (401):

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid Authorization header"
  }
}
```

**Invalid token:**

```bash
curl -X GET http://localhost:5001/YOUR_PROJECT_ID/us-central1/apiV2/v2/users/me \
  -H "Authorization: Bearer invalid.jwt.token"
```

Response (401):

```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid access token"
  }
}
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ Yes | - | Secret key for signing JWTs |
| `JWT_ACCESS_EXPIRY` | ❌ No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRY` | ❌ No | `30d` | Refresh token TTL |

### Security Recommendations

1. **JWT_SECRET**: Use a minimum of 32 characters, randomly generated
2. **Access Token TTL**: Keep short (5-15 minutes)
3. **Refresh Token**: Store hashed in Firestore, implement rotation
4. **HTTPS Only**: Never send tokens over HTTP in production
5. **CORS**: Restrict allowed origins in production

---

## 📝 Next Steps (Week 1 Remaining)

- [ ] Implement `/v2/auth/login/github` endpoint
- [ ] Implement `/v2/auth/refresh` with token rotation
- [ ] Implement `/v2/auth/logout` endpoint
- [ ] Create `sessions` repository for refresh token management
- [ ] Add re-use detection for refresh tokens
- [ ] Update CORS to use allowlist instead of wildcard

---

## 🐛 Troubleshooting

### "JWT_SECRET environment variable is not set"

**Solution**: Create `backend/.env` and add `JWT_SECRET=your_secret_key`

### TypeScript error: "Property 'user' does not exist on type 'Request'"

**Solution**: Ensure `src/types/express.d.ts` is included in `tsconfig.json`:

```json
{
  "include": [
    "src/**/*"
  ]
}
```

### Middleware not catching errors

**Solution**: Ensure `errorHandler` is the **last** middleware in the chain:

```typescript
app.use("/v2", v2Router);
app.use(errorHandler); // Must be last
```

---

## 📚 References

- [JWT RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [Firebase Functions v2](https://firebase.google.com/docs/functions)
- [TypeScript Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)

---

## ✅ Implementation Checklist

- [x] Create `types/auth.ts` with Role and AccessTokenPayload
- [x] Extend Express Request interface via `types/express.d.ts`
- [x] Implement `AppError` custom error class
- [x] Create global `errorHandler` middleware
- [x] Implement `authMiddleware` for JWT verification
- [x] Create `requireRole` factory and helper constants
- [x] Build test controller `getMe`
- [x] Setup v2 router with Express
- [x] Integrate v2 API into main `index.ts`
- [x] Update `package.json` with dependencies
- [x] Verify TypeScript compilation succeeds
- [x] Document API usage and testing

**Status**: ✅ **TASK 1 COMPLETE**
