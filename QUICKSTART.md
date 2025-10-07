# MailOx Backend - Quick Start Guide

## ✅ What's Been Set Up

Your MailOx backend is now ready with:

1. ✅ **Database Schema** - Complete Prisma schema with all tables
2. ✅ **Authentication System** - JWT-based auth with bcrypt password hashing
3. ✅ **Email API** - CRUD operations for emails
4. ✅ **AI Threat Scanner** - OpenAI-powered phishing detection
5. ✅ **Stats API** - Dashboard statistics
6. ✅ **API Client** - Frontend helper for making API calls

## 🚀 Get Started in 3 Steps

### Step 1: Set Up Environment Variables

Create `.env.local` in the root directory:

```bash
# Copy the template
cp env.template .env.local
```

Minimal setup to get started:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
NEXTAUTH_SECRET="your-nextauth-secret-min-32-chars"
OPENAI_API_KEY="sk-your-openai-api-key"
```

### Step 2: Database is Already Set Up! ✅

The database has been created with:
```bash
npx prisma generate  # ✅ Done
npx prisma db push   # ✅ Done
```

Your SQLite database is at: `prisma/dev.db`

### Step 3: Start the Server

```bash
npm run dev
```

Server runs at: http://localhost:3000

## 🧪 Test the API

### 1. Create an Account

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "Test User"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "name": "Test User"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### 3. Get Current User

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Get Stats

```bash
curl http://localhost:3000/api/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 💻 Use in Your Frontend

Update your signup/login pages to use the API:

```typescript
// In your signup page
import { apiClient } from '@/lib/api-client';

const handleFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoadingForm(true);
  
  try {
    const response = await apiClient.signup(email, password, name);
    
    if (response.success) {
      // Token is automatically stored
      // Set first login flag
      localStorage.setItem('isFirstLogin', 'true');
      
      // Redirect to dashboard
      window.location.href = '/home';
    }
  } catch (error) {
    console.error('Signup error:', error);
    alert(error.message);
  } finally {
    setIsLoadingForm(false);
  }
};
```

```typescript
// In your login page
import { apiClient } from '@/lib/api-client';

const handleFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoadingForm(true);
  
  try {
    const response = await apiClient.login(email, password);
    
    if (response.success) {
      // Token is automatically stored
      // Redirect to dashboard
      window.location.href = '/home';
    }
  } catch (error) {
    console.error('Login error:', error);
    alert(error.message);
  } finally {
    setIsLoadingForm(false);
  }
};
```

```typescript
// In your dashboard to load emails
import { apiClient } from '@/lib/api-client';
import { useEffect, useState } from 'react';

const [emails, setEmails] = useState([]);
const [stats, setStats] = useState(null);

useEffect(() => {
  async function loadData() {
    try {
      const [emailsRes, statsRes] = await Promise.all([
        apiClient.getEmails({ page: 1, limit: 30 }),
        apiClient.getStats()
      ]);
      
      if (emailsRes.success) {
        setEmails(emailsRes.data.emails);
      }
      
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Redirect to login if unauthorized
      if (error.message === 'Unauthorized') {
        window.location.href = '/auth/login';
      }
    }
  }
  
  loadData();
}, []);
```

## 📊 View Your Database

```bash
npx prisma studio
```

Opens at: http://localhost:5555

## 🔑 Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. Add to `.env.local`: `OPENAI_API_KEY="sk-..."`

**Free Tier**: $5 free credits for new users

## 📁 Project Structure

```
mail0x/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── dev.db                 # SQLite database
├── src/
│   ├── app/api/               # API Routes
│   │   ├── auth/
│   │   │   ├── signup/route.ts
│   │   │   ├── login/route.ts
│   │   │   └── me/route.ts
│   │   ├── emails/
│   │   │   ├── route.ts       # GET /api/emails
│   │   │   └── [id]/route.ts  # GET/PATCH/DELETE /api/emails/:id
│   │   └── stats/route.ts     # GET /api/stats
│   └── lib/
│       ├── prisma.ts          # Database client
│       ├── auth.ts            # Auth utilities
│       ├── ai-scanner.ts      # AI threat detection
│       └── api-client.ts      # Frontend API helper
├── env.template               # Environment variables template
├── BACKEND_README.md          # Full documentation
└── QUICKSTART.md              # This file
```

## 🎯 Next Steps

1. **Test the API** - Use the curl commands above
2. **Integrate with Frontend** - Update your signup/login pages
3. **Add Gmail Integration** - Connect real email accounts
4. **Configure OpenAI** - For AI threat detection
5. **Add More Features** - Whitelist, blacklist, reports, etc.

## 🔧 Common Commands

```bash
# Start development server
npm run dev

# View database
npx prisma studio

# Reset database (if needed)
npx prisma migrate reset

# Generate Prisma client (after schema changes)
npx prisma generate

# Push schema changes to database
npx prisma db push
```

## 🆘 Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Database errors
```bash
npx prisma generate
npx prisma db push
```

### TypeScript errors
Restart your editor or run:
```bash
npm run build
```

## 📚 Full Documentation

See `BACKEND_README.md` for complete documentation including:
- Detailed API endpoints
- AI scanning service details
- Gmail/Outlook integration guides
- Production deployment
- Security best practices

## 🎉 You're Ready!

Your backend is fully set up and ready to use. Start with the test API calls above, then integrate with your frontend!

Need help? Check the full documentation in `BACKEND_README.md`.

