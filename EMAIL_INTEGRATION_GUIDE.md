# Email Integration Guide - Gmail & Outlook

## 🎯 Overview

MailOx now supports connecting Gmail and Outlook accounts via OAuth 2.0. This guide explains how to set up and use email integration.

---

## 📋 Prerequisites

### 1. Gmail Integration Setup

#### Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

#### Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Configure:
   - **Name**: MailOx Gmail Integration
   - **Authorized redirect URIs**: 
     - Dev: `http://localhost:3000/api/gmail/callback`
     - Prod: `https://yourdomain.com/api/gmail/callback`
5. Save and copy:
   - **Client ID**
   - **Client Secret**

#### Configure OAuth Consent Screen
1. Go to "OAuth consent screen"
2. Choose "External" (for testing) or "Internal" (for organization only)
3. Fill required fields:
   - App name: MailOx
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Add test users (if External and not published)

---

### 2. Outlook Integration Setup

#### Create Azure App Registration
1. Go to https://portal.azure.com/
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Configure:
   - **Name**: MailOx Outlook Integration
   - **Supported account types**: "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI**: 
     - Platform: Web
     - Dev: `http://localhost:3000/api/outlook/callback`
     - Prod: `https://yourdomain.com/api/outlook/callback`

#### Configure API Permissions
1. Go to your app > "API permissions"
2. Click "Add a permission" > "Microsoft Graph"
3. Choose "Delegated permissions"
4. Add these permissions:
   - `Mail.Read`
   - `Mail.ReadWrite`
   - `User.Read`
   - `offline_access`
5. Click "Grant admin consent" (if you have admin rights)

#### Get Credentials
1. Go to "Overview" and copy:
   - **Application (client) ID**
2. Go to "Certificates & secrets"
3. Click "New client secret"
4. Copy the **Client secret value** (not the ID!)

---

## ⚙️ Configuration

Add these to your `.env.local`:

```env
# Gmail API
GMAIL_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="your-google-client-secret"
GMAIL_REDIRECT_URI="http://localhost:3000/api/gmail/callback"

# Microsoft OAuth
MICROSOFT_CLIENT_ID="your-microsoft-app-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
MICROSOFT_REDIRECT_URI="http://localhost:3000/api/outlook/callback"
```

---

## 🔌 API Endpoints

### Gmail OAuth Flow

#### 1. Get Authorization URL
```bash
GET /api/gmail/authorize
Headers: Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

#### 2. User Authorizes (Redirect)
User is redirected to Google's consent screen, then back to:
```
GET /api/gmail/callback?code=xxx&state=userId
```

This endpoint automatically:
- Exchanges code for tokens
- Gets user's Gmail address
- Saves account to database
- Redirects to `/settings?success=gmail_connected`

#### 3. Sync Emails
```bash
POST /api/gmail/sync
Headers: Authorization: Bearer <token>
Body: { "emailAccountId": "account-id" }
```

Response:
```json
{
  "success": true,
  "message": "Synced 25 new emails",
  "data": {
    "imported": 25,
    "scanned": 25,
    "total": 50
  }
}
```

---

### Outlook OAuth Flow

#### 1. Get Authorization URL
```bash
GET /api/outlook/authorize
Headers: Authorization: Bearer <token>
```

#### 2. User Authorizes (Redirect)
Redirects back to:
```
GET /api/outlook/callback?code=xxx&state=userId
```

#### 3. Sync Emails
```bash
POST /api/outlook/sync
Headers: Authorization: Bearer <token>
Body: { "emailAccountId": "account-id" }
```

---

## 💻 Frontend Integration

### Update Settings Page

Replace the placeholder OAuth buttons with real integration:

```typescript
// In src/app/(app)/(dashboard)/settings/page.tsx
import { apiClient } from '@/lib/api-client';

// Gmail Connection
const handleGmailConnect = async () => {
  try {
    const response = await apiClient.getGmailAuthUrl();
    if (response.success) {
      // Redirect to Google OAuth
      window.location.href = response.data.authUrl;
    }
  } catch (error) {
    console.error('Gmail auth error:', error);
    alert('Failed to connect Gmail');
  }
};

// Outlook Connection
const handleOutlookConnect = async () => {
  try {
    const response = await apiClient.getOutlookAuthUrl();
    if (response.success) {
      // Redirect to Microsoft OAuth
      window.location.href = response.data.authUrl;
    }
  } catch (error) {
    console.error('Outlook auth error:', error);
    alert('Failed to connect Outlook');
  }
};

// In the JSX, replace onClick handlers:
<button onClick={handleGmailConnect}>
  Connect Gmail
</button>

<button onClick={handleOutlookConnect}>
  Connect Outlook
</button>
```

### Handle Callback Success

```typescript
// In settings page, check URL params on mount
useEffect(() => {
  const searchParams = new URLSearchParams(window.location.search);
  const success = searchParams.get('success');
  const email = searchParams.get('email');
  const error = searchParams.get('error');

  if (success === 'gmail_connected' && email) {
    alert(`Gmail account ${email} connected successfully!`);
    // Reload connected accounts
    loadEmailAccounts();
    // Clean URL
    window.history.replaceState({}, '', '/settings');
  }

  if (success === 'outlook_connected' && email) {
    alert(`Outlook account ${email} connected successfully!`);
    loadEmailAccounts();
    window.history.replaceState({}, '', '/settings');
  }

  if (error) {
    alert(`Connection failed: ${error}`);
    window.history.replaceState({}, '', '/settings');
  }
}, []);
```

### Load Connected Accounts

```typescript
const [connectedAccounts, setConnectedAccounts] = useState([]);

useEffect(() => {
  loadEmailAccounts();
}, []);

async function loadEmailAccounts() {
  try {
    const response = await apiClient.getEmailAccounts();
    if (response.success) {
      setConnectedAccounts(response.data.emailAccounts);
    }
  } catch (error) {
    console.error('Load accounts error:', error);
  }
}
```

### Sync Emails Button

```typescript
const handleSync = async (accountId: string, provider: string) => {
  try {
    const response = provider === 'gmail'
      ? await apiClient.syncGmailAccount(accountId)
      : await apiClient.syncOutlookAccount(accountId);

    if (response.success) {
      alert(`Synced ${response.data.imported} new emails!`);
    }
  } catch (error) {
    console.error('Sync error:', error);
    alert('Failed to sync emails');
  }
};

// In JSX
{connectedAccounts.map((account) => (
  <div key={account.id}>
    <p>{account.email}</p>
    <button onClick={() => handleSync(account.id, account.provider)}>
      Sync Now
    </button>
    <button onClick={() => handleDisconnect(account.id)}>
      Disconnect
    </button>
  </div>
))}
```

---

## 🔄 Auto-Sync Implementation

For automatic email syncing, you can:

### Option 1: Client-Side Polling (Simple)

```typescript
// In dashboard or settings page
useEffect(() => {
  const syncInterval = setInterval(async () => {
    const accounts = await apiClient.getEmailAccounts();
    for (const account of accounts.data.emailAccounts) {
      if (account.isActive) {
        if (account.provider === 'gmail') {
          await apiClient.syncGmailAccount(account.id);
        } else if (account.provider === 'outlook') {
          await apiClient.syncOutlookAccount(account.id);
        }
      }
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  return () => clearInterval(syncInterval);
}, []);
```

### Option 2: Background Job (Recommended for Production)

Create a cron job API endpoint:

```typescript
// src/app/api/cron/sync-emails/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all active email accounts
  const accounts = await prisma.emailAccount.findMany({
    where: { isActive: true },
  });

  // Sync each account
  for (const account of accounts) {
    // Call sync logic...
  }

  return NextResponse.json({ success: true });
}
```

Then use Vercel Cron or similar to call this endpoint every 5 minutes.

---

## 🔐 Security Notes

1. **Never commit credentials** - Keep `.env.local` in `.gitignore`
2. **Use HTTPS in production** - OAuth requires secure redirect URIs
3. **Token rotation** - Refresh tokens are automatically handled
4. **Scope limitation** - Only request necessary permissions
5. **User consent** - Always show what access you're requesting

---

## 🐛 Troubleshooting

### Gmail: "Access blocked: This app's request is invalid"
- Check redirect URI matches exactly in Google Console
- Ensure Gmail API is enabled
- Verify OAuth consent screen is configured

### Gmail: "This app isn't verified"
- During development, click "Advanced" > "Go to MailOx (unsafe)"
- For production, submit app for verification

### Outlook: "AADSTS50011: The redirect URI doesn't match"
- Check redirect URI in Azure matches exactly
- Include the protocol (http:// or https://)

### "Token expired" errors
- The code automatically refreshes tokens
- Check that refresh tokens are being saved
- Verify SMTP credentials for Outlook

### No emails syncing
- Check account lastSyncedAt timestamp
- Verify token expiry dates
- Check API quotas in Google/Microsoft consoles

---

## 📊 API Quotas

### Gmail API
- **Free tier**: 1 billion quota units/day
- **User rate limit**: 250 quota units/user/second
- Cost: ~5 units per email fetch

### Microsoft Graph (Outlook)
- **Free tier**: 1000 requests/minute/app
- **Per-user limit**: Varies by subscription
- Generally sufficient for most use cases

---

## 🚀 Production Checklist

- [ ] Set up production OAuth apps (Gmail & Outlook)
- [ ] Configure production redirect URIs
- [ ] Update environment variables
- [ ] Implement background sync job
- [ ] Add error monitoring (Sentry, etc.)
- [ ] Test token refresh flow
- [ ] Submit OAuth app for review (if needed)
- [ ] Document user permission requirements
- [ ] Add rate limiting
- [ ] Monitor API quota usage

---

## 📝 Example Flow

1. User clicks "Connect Gmail" in settings
2. Frontend calls `/api/gmail/authorize`
3. User is redirected to Google
4. User grants permissions
5. Google redirects to `/api/gmail/callback`
6. Backend exchanges code for tokens
7. Backend saves account to database
8. User is redirected to `/settings?success=gmail_connected`
9. Frontend shows success message
10. User clicks "Sync Now"
11. Backend fetches last 50 emails from Gmail
12. Each email is scanned by AI
13. Threat analysis is performed
14. Malicious emails auto-quarantined
15. User sees emails in dashboard

---

## 🔗 Resources

- [Gmail API Docs](https://developers.google.com/gmail/api)
- [Microsoft Graph Mail API](https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [Azure Portal](https://portal.azure.com/)

---

Need help? Check the logs or open an issue!

