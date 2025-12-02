# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GDGoC (Google Developer Groups on Campus) KAIST website project with a Firebase-based backend. The backend provides REST APIs for user authentication via GitHub OAuth, member management, image storage, and admin approval workflows with email notifications.

## Development Setup

### Prerequisites

- Node.js 22 (specified in functions/package.json engines)
- Firebase CLI (installed via `firebase-tools` package)

### Initial Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Install Firebase CLI if not already installed
npm install -g firebase-tools  # or use npx

# Login to Firebase
npx firebase login

# Set up environment variables for email
# Create backend/functions/lib/.env with:
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-app-password
# ADMIN_EMAIL=admin@example.com
```

### Common Development Commands

```bash
# Start Firebase emulators (all services)
cd backend
npx firebase emulators:start

# Start only Functions emulator
npx firebase emulators:start --only functions

# Build TypeScript functions
cd backend/functions
npm run build

# Watch mode for TypeScript compilation
npm run build:watch

# Lint code
npm run lint

# Deploy to Firebase (requires Blaze plan)
npx firebase deploy --only functions

# Generate API documentation
cd backend
./generate-api-docs.sh
```

### Emulator Access URLs

When emulators are running:
- **Functions**: http://localhost:5001
- **Emulator UI**: http://localhost:4000
- **Firestore**: http://localhost:8080
- **Storage**: http://localhost:9199
- **API Swagger Docs**: http://localhost:5001/gdgoc-web/us-central1/apiDocs

## Project Architecture

### Backend Structure (TypeScript)

The backend follows a layered architecture pattern:

```
backend/functions/src/
├── index.ts              # Entry point, exports all Cloud Functions
├── config/               # Configuration modules
│   ├── firebase.ts       # Firebase Admin SDK initialization
│   └── email.ts          # Email service configuration
├── controllers/          # HTTP request handlers (thin layer)
│   ├── authController.ts      # GitHub OAuth login/signup
│   ├── adminController.ts     # Admin operations
│   ├── approvalController.ts  # Approval link handling
│   ├── memberController.ts    # Member CRUD
│   └── imageController.ts     # Image CRUD with uploads
├── services/             # Business logic layer
│   ├── authService.ts    # Authentication business logic
│   ├── adminService.ts   # Admin operations
│   ├── memberService.ts  # Member management
│   └── imageService.ts   # Image processing
├── repositories/         # Data access layer
│   ├── userRepository.ts    # Firestore users collection
│   ├── memberRepository.ts  # Firestore members collection
│   ├── imageRepository.ts   # Firestore images collection
│   └── storageRepository.ts # Firebase Storage operations
├── utils/                # Utility functions
│   ├── cors.ts           # CORS headers
│   ├── email.ts          # Nodemailer email sending
│   ├── token.ts          # Approval token generation
│   └── multipart.ts      # Multipart form parsing
├── types/                # TypeScript type definitions
│   ├── user.ts           # User data types & UserStatus enum
│   ├── member.ts         # Member data types
│   └── image.ts          # Image data types
└── handlers/             # Special handlers
    └── docs.ts           # API documentation endpoints
```

**Architecture Pattern**: Controller → Service → Repository
- **Controllers**: Handle HTTP requests/responses, validation, CORS
- **Services**: Implement business logic, orchestrate multiple repositories
- **Repositories**: Direct database/storage operations (Firestore, Storage)

### Key Data Models

**Users Collection** (`users`):
- Stores GitHub OAuth authenticated users
- Status flow: `pending` → `approved` or `rejected`
- Fields: `githubId`, `githubUsername`, `email`, `name`, `profileImageUrl`, `status`, `isAdmin`

**Members Collection** (`members`):
- Stores member profiles (managed by admins)
- Fields: `name`, `email`, `department`, `studentId`, `githubUsername`, `isAdmin`

**Images Collection** (`images`):
- Stores image metadata with Firebase Storage integration
- Fields: `name`, `description`, `url`, `storagePath`

### Authentication & Approval Flow

1. **User Registration** (`loginWithGitHub`):
   - Client sends GitHub access token
   - Backend fetches user info from GitHub API
   - Creates user with `status: "pending"`
   - Sends email notification to all admins (`isAdmin: true`)

2. **Admin Approval**:
   - Admin receives email with approve/reject links
   - Links contain signed tokens for security
   - `approveUser` or `rejectUser` endpoints update status
   - User receives email notification of decision

3. **Email Recipients**:
   - Registration → All admin members' emails (from `members` collection where `isAdmin: true`)
   - Fallback → `ADMIN_EMAIL` env var or `admin@gdgoc.kaist.ac.kr`
   - Approval/Rejection → User's email (from GitHub)

### Email Configuration

Email sending uses Nodemailer with Gmail SMTP by default:
- **Required env vars** (in `backend/functions/lib/.env`):
  - `EMAIL_USER`: Sender Gmail address
  - `EMAIL_PASSWORD`: Gmail app password (NOT regular password)
  - `ADMIN_EMAIL`: Comma-separated admin emails (optional)
- **Optional**: `EMAIL_HOST`, `EMAIL_PORT` for other SMTP services
- Gmail app password setup: https://myaccount.google.com/apppasswords

### TypeScript Compilation

- **Source**: `functions/src/` (TypeScript)
- **Output**: `functions/lib/` (JavaScript)
- **Config**: `functions/tsconfig.json`
- Module system: NodeNext with ESM support
- Always build before deploying: `npm run build`

### Firebase Services Used

- **Cloud Functions**: HTTP triggered functions (Node 22 runtime)
- **Firestore**: NoSQL database for users, members, images
- **Cloud Storage**: File storage for uploaded images
- **Authentication**: GitHub OAuth (handled via custom tokens)

### API Testing

Use provided shell scripts:
```bash
# Test GitHub login/signup
cd backend
./test-login.sh YOUR_GITHUB_TOKEN

# Test email sending
./test-email.sh YOUR_GITHUB_TOKEN

# Test various API endpoints
./test-api.sh
```

Or use Swagger UI at the apiDocs endpoint when emulators are running.

### GitHub Token for Testing

To test authentication:
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Required scopes: `read:user`, `user:email`
4. Token format: `ghp_xxxxxxxxxxxxxxxxxxxx`

## Important Notes

### Git Status
- Current branch: `main`
- Recent commits focus on GitHub OAuth integration and member CRUD operations
- The codebase is in active development

### Environment Variables
- **Never commit** `.env` files (already in `.gitignore`)
- Local development uses `backend/functions/lib/.env`
- Production uses Firebase Functions config or console environment variables

### Deployment Requirements
- Firebase Functions requires **Blaze (pay-as-you-go) plan**
- Free tier available with generous quotas for small-scale use
- Predeploy hooks run lint and build automatically

### CORS
All endpoints have CORS enabled (`Access-Control-Allow-Origin: *`) for development convenience. Consider restricting in production.

### Testing Without Email
If email env vars are not set, emulators log email content to console instead of sending actual emails.

## File Locations Reference

- Firebase config: `backend/firebase.json`
- TypeScript config: `backend/functions/tsconfig.json`
- Functions entry: `backend/functions/src/index.ts`
- Email flow documentation: `backend/EMAIL_FLOW.md`
- API documentation: `backend/functions/API.md`
- GitHub token guide: `backend/GITHUB_TOKEN_GUIDE.md`
