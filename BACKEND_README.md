# MailOx Backend Documentation

## 🏗️ Architecture Overview

MailOx uses Next.js API routes as the backend, with the following stack:

- **Framework**: Next.js 15 API Routes
- **Database**: Prisma + SQLite (dev) / PostgreSQL (production)
- **Authentication**: JWT + bcrypt
- **AI**: OpenAI GPT-4 for threat detection
- **Email Integration**: Gmail API, Microsoft Graph API

## 📁 Project Structure

```
src/
├── app/api/                    # API Routes
│   ├── auth/
│   │   ├── signup/route.ts    # User registration
│   │   ├── login/route.ts     # User login
│   │   └── me/route.ts        # Get current user
│   ├── emails/
│   │   ├── route.ts           # List emails
│   │   └── [id]/route.ts      # Email CRUD operations
│   └── stats/route.ts         # Dashboard statistics
├── lib/
│   ├── prisma.ts              # Database client
│   ├── auth.ts                # Authentication utilities
│   └── ai-scanner.ts          # AI email scanning service
└── prisma/
    └── schema.prisma          # Database schema

```

## 🗄️ Database Schema

### Core Tables

1. **User** - User accounts
2. **EmailAccount** - Connected email accounts (Gmail, Outlook, etc.)
3. **Email** - Scanned emails with threat data
4. **QuarantinedEmail** - Blocked/suspicious emails
5. **ThreatAnalysis** - Detailed AI analysis results
6. **UserSettings** - User preferences
7. **SecurityReport** - Analytics and reports
8. **Whitelist/Blacklist** - User-defined rules

## 🔐 Authentication Flow

### 1. Signup
```
POST /api/auth/signup
Body: { email, password, name }
Response: { user, token }
```

### 2. Login
```
POST /api/auth/login
Body: { email, password }
Response: { user, token }
```

### 3. Get Current User
```
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: { user }
```

## 📧 Email API Endpoints

### List Emails
```
GET /api/emails?page=1&limit=30&status=safe
Headers: { Authorization: "Bearer <token>" }
Response: { emails[], pagination }
```

### Get Single Email
```
GET /api/emails/:id
Headers: { Authorization: "Bearer <token>" }
Response: { email, analysis, quarantine }
```

### Update Email
```
PATCH /api/emails/:id
Body: { isRead: true, isStarred: false }
Headers: { Authorization: "Bearer <token>" }
```

### Delete Email
```
DELETE /api/emails/:id
Headers: { Authorization: "Bearer <token>" }
```

## 🤖 AI Threat Detection

The AI scanner (`src/lib/ai-scanner.ts`) performs multi-layered analysis:

### 1. Heuristic Analysis
- Urgent language detection
- Credential request detection
- Domain spoofing check
- Link analysis
- Attachment scanning

### 2. AI Analysis (OpenAI)
- Advanced phishing detection
- Social engineering tactics
- Context-aware threat assessment
- Confidence scoring

### 3. Threat Scoring
- Score: 0-100
- Levels: safe (0-39), suspicious (40-69), malicious (70-100)
- Auto-quarantine based on user settings

### Example Scan Result
```json
{
  "threatScore": 85,
  "threatLevel": "malicious",
  "threatFlags": [
    "Urgent language detected",
    "Credential request detected",
    "2 phishing links detected"
  ],
  "analysis": {
    "hasUrgentLanguage": true,
    "hasCredentialRequest": true,
    "totalLinks": 3,
    "phishingLinks": 2,
    "aiConfidenceScore": 0.92,
    "aiPrediction": "malicious"
  }
}
```

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `env.template` to `.env.local` and fill in your values:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"
OPENAI_API_KEY="sk-..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### 3. Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Create database
npx prisma db push

# (Optional) Open Prisma Studio
npx prisma studio
```

### 4. Run Development Server
```bash
npm run dev
```

## 🔑 Getting API Keys

### OpenAI API
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `.env.local` as `OPENAI_API_KEY`

### Google OAuth (for authentication)
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials
5. Add authorized redirect: `http://localhost:3000/api/auth/callback/google`

### Gmail API (for email integration)
1. Enable Gmail API in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add scope: `https://www.googleapis.com/auth/gmail.readonly`

### Microsoft OAuth (for Outlook)
1. Go to https://portal.azure.com/
2. Register an application
3. Add Microsoft Graph permissions
4. Configure redirect URI

## 📊 Database Commands

```bash
# View database in browser
npx prisma studio

# Create migration
npx prisma migrate dev --name init

# Reset database
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate
```

## 🧪 Testing the API

### Using cURL
```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Get emails (use token from login)
curl http://localhost:3000/api/emails \
  -H "Authorization: Bearer <your-token>"
```

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Use strong JWT secrets** - Generate with `openssl rand -base64 32`
3. **Hash passwords** - We use bcrypt with 12 rounds
4. **Validate inputs** - We use Zod for schema validation
5. **Rate limiting** - TODO: Add rate limiting middleware
6. **CORS configuration** - Configure for production domains

## 🚢 Production Deployment

### 1. Switch to PostgreSQL
Update `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Environment Variables
Set production values for:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your production domain
- `NEXTAUTH_SECRET` - Strong random secret
- `JWT_SECRET` - Different from NEXTAUTH_SECRET
- All API keys

### 3. Deploy
```bash
npm run build
npm start
```

## 📈 Next Steps

1. ✅ Database schema created
2. ✅ Authentication system implemented
3. ✅ AI scanning service built
4. ✅ Email API routes created
5. 🔄 Gmail API integration (in progress)
6. 🔄 Outlook API integration (in progress)
7. ⏳ Webhook endpoints for real-time scanning
8. ⏳ Background jobs for email sync
9. ⏳ Rate limiting middleware
10. ⏳ Email notification service

## 🆘 Troubleshooting

### Prisma errors
```bash
# Clear and regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

### Database locked
```bash
# SQLite only - delete and recreate
rm prisma/dev.db
npx prisma db push
```

### TypeScript errors
```bash
# Restart TS server in VSCode
# Or rebuild
npm run build
```

## 📚 Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [OpenAI API](https://platform.openai.com/docs)
- [Gmail API](https://developers.google.com/gmail/api/guides)
- [Microsoft Graph](https://learn.microsoft.com/en-us/graph/overview)

