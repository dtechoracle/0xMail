# MailOx API Endpoints Documentation

## 🔐 Authentication

All authenticated endpoints require an `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### 1. Sign Up
**POST** `/api/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Login
**POST** `/api/auth/login`

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Get Current User
**GET** `/api/auth/me`

Get the currently authenticated user's information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "name": "John Doe",
      "emailVerified": null
    }
  }
}
```

---

## User Profile Endpoints

### 4. Get User Profile
**GET** `/api/user/profile`

Get the user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "name": "John Doe",
      "image": null,
      "emailVerified": null
    }
  }
}
```

---

### 5. Update User Profile
**PATCH** `/api/user/profile`

Update the user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "newemail@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "clx...",
      "email": "newemail@example.com",
      "name": "Jane Doe"
    }
  }
}
```

---

### 6. Change Password
**POST** `/api/user/password`

Change the user's password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

## Settings Endpoints

### 7. Get User Settings
**GET** `/api/settings`

Get the user's settings.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "settings": {
      "id": "clx...",
      "userId": "clx...",
      "emailNotifications": true,
      "pushNotifications": false,
      "weeklyReports": true,
      "autoQuarantine": true,
      "strictMode": false,
      "scanAttachments": true,
      "threatSensitivity": 3,
      "autoSync": true,
      "syncInterval": 5
    }
  }
}
```

---

### 8. Update User Settings
**PUT** `/api/settings`

Update the user's settings.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "emailNotifications": true,
  "autoQuarantine": true,
  "strictMode": true,
  "threatSensitivity": 4
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "settings": { ... }
  }
}
```

---

## Email Accounts Endpoints

### 9. Get Connected Email Accounts
**GET** `/api/email-accounts`

Get all connected email accounts.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emailAccounts": [
      {
        "id": "clx...",
        "provider": "gmail",
        "email": "user@gmail.com",
        "isActive": true,
        "lastSyncedAt": "2025-10-07T10:00:00Z",
        "createdAt": "2025-10-01T08:00:00Z"
      }
    ]
  }
}
```

---

### 10. Connect Email Account
**POST** `/api/email-accounts`

Connect a new email account.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "provider": "gmail",
  "email": "user@gmail.com",
  "accessToken": "ya29...",
  "refreshToken": "1//..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email account connected successfully",
  "data": {
    "emailAccount": {
      "id": "clx...",
      "provider": "gmail",
      "email": "user@gmail.com",
      "isActive": true
    }
  }
}
```

---

### 11. Disconnect Email Account
**DELETE** `/api/email-accounts/:id`

Disconnect an email account.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Email account disconnected successfully"
}
```

---

### 12. Toggle Email Account
**PATCH** `/api/email-accounts/:id`

Toggle email account active status.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "isActive": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email account updated successfully",
  "data": {
    "emailAccount": { ... }
  }
}
```

---

## Email Endpoints

### 13. List Emails
**GET** `/api/emails?page=1&limit=30&status=safe&starred=true`

Get a paginated list of emails.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 30)
- `status` (optional): Filter by threat level (`safe`, `suspicious`, `malicious`)
- `starred` (optional): Filter by starred status (`true`, `false`)

**Response:**
```json
{
  "success": true,
  "data": {
    "emails": [
      {
        "id": "clx...",
        "messageId": "msg...",
        "subject": "Important Update",
        "from": "sender@example.com",
        "to": "user@example.com",
        "body": "Email body content...",
        "receivedAt": "2025-10-07T10:00:00Z",
        "isRead": false,
        "isStarred": false,
        "threatScore": 15,
        "threatLevel": "safe",
        "threatFlags": [],
        "scanStatus": "completed"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 30,
      "total": 100,
      "pages": 4
    }
  }
}
```

---

### 14. Get Single Email
**GET** `/api/emails/:id`

Get detailed information about a specific email.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "email": {
      "id": "clx...",
      "subject": "Important Update",
      "from": "sender@example.com",
      "body": "Email body content...",
      "threatScore": 85,
      "threatLevel": "malicious",
      "threatFlags": ["Urgent language", "Phishing link"],
      "analysis": {
        "totalLinks": 3,
        "suspiciousLinks": 1,
        "phishingLinks": 1,
        "hasUrgentLanguage": true,
        "aiConfidenceScore": 0.92,
        "aiPrediction": "malicious"
      },
      "quarantine": {
        "id": "clx...",
        "reason": ["Phishing attempt", "Spoofed domain"],
        "quarantinedAt": "2025-10-07T10:00:00Z"
      }
    }
  }
}
```

---

### 15. Update Email
**PATCH** `/api/emails/:id`

Update email properties (read status, starred status).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "isRead": true,
  "isStarred": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "email": { ... }
  }
}
```

---

### 16. Delete Email
**DELETE** `/api/emails/:id`

Permanently delete an email.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Email deleted successfully"
}
```

---

## Quarantine Endpoints

### 17. List Quarantined Emails
**GET** `/api/quarantine?page=1&limit=30`

Get a paginated list of quarantined emails.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "quarantinedEmails": [
      {
        "id": "clx...",
        "emailId": "clx...",
        "reason": ["Phishing attempt", "Spoofed domain"],
        "quarantinedAt": "2025-10-07T10:00:00Z",
        "email": {
          "subject": "Urgent: Verify Account",
          "from": "fake@phishing.com",
          "threatScore": 95,
          "threatLevel": "malicious"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 30,
      "total": 10,
      "pages": 1
    }
  }
}
```

---

### 18. Quarantine Action
**POST** `/api/quarantine/:id`

Perform an action on a quarantined email.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "action": "release"
}
```

**Actions:**
- `release`: Remove from quarantine and mark as safe
- `delete`: Permanently delete the email
- `block_sender`: Add sender to blacklist and delete email

**Response:**
```json
{
  "success": true,
  "message": "Email released from quarantine"
}
```

---

### 19. Delete Quarantined Email
**DELETE** `/api/quarantine/:id`

Permanently delete a quarantined email.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Email deleted permanently"
}
```

---

## Stats Endpoint

### 20. Get Dashboard Stats
**GET** `/api/stats`

Get statistics for the dashboard.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProcessed": 1247,
    "safeEmails": 1089,
    "suspiciousEmails": 98,
    "threatsBlocked": 60
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Using the API Client

Instead of making direct HTTP requests, use the provided API client:

```typescript
import { apiClient } from '@/lib/api-client';

// Login
const response = await apiClient.login('user@example.com', 'password');

// Get emails
const emails = await apiClient.getEmails({ page: 1, limit: 30 });

// Update settings
await apiClient.updateSettings({
  autoQuarantine: true,
  threatSensitivity: 4
});

// Get quarantined emails
const quarantine = await apiClient.getQuarantinedEmails();
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting middleware for production.

---

## Authentication Flow

1. User signs up: `POST /api/auth/signup`
2. Receive JWT token
3. Store token in localStorage (handled by apiClient)
4. Include token in all subsequent requests
5. Token expires after 7 days
6. User logs in again to get new token

---

## Best Practices

1. **Always validate tokens** - Check expiration on client side
2. **Handle errors gracefully** - Show user-friendly messages
3. **Use pagination** - Don't load all emails at once
4. **Cache responses** - Store user data locally when appropriate
5. **Refresh tokens** - Implement token refresh before expiration

---

## Testing the API

Use the provided curl commands in `QUICKSTART.md` or tools like:
- **Postman** - https://www.postman.com/
- **Insomnia** - https://insomnia.rest/
- **Thunder Client** - VSCode extension

---

## Production Considerations

1. Add rate limiting
2. Implement request logging
3. Add CORS configuration
4. Use HTTPS only
5. Implement token refresh mechanism
6. Add API versioning (`/api/v1/...`)
7. Monitor API usage and errors
8. Implement webhook endpoints for real-time updates

