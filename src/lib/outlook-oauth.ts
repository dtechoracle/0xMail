// Microsoft Graph API for Outlook integration

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || '';
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/outlook/callback';

const SCOPES = [
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/Mail.ReadWrite',
  'https://graph.microsoft.com/User.Read',
  'offline_access',
];

/**
 * Generate authorization URL for Microsoft OAuth
 */
export function getOutlookAuthUrl(userId: string) {
  const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  
  authUrl.searchParams.append('client_id', MICROSOFT_CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', MICROSOFT_REDIRECT_URI);
  authUrl.searchParams.append('scope', SCOPES.join(' '));
  authUrl.searchParams.append('state', userId);
  authUrl.searchParams.append('response_mode', 'query');
  authUrl.searchParams.append('prompt', 'consent');

  return authUrl.toString();
}

/**
 * Exchange authorization code for tokens
 */
export async function getOutlookTokens(code: string) {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      code,
      redirect_uri: MICROSOFT_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get tokens');
  }

  return response.json();
}

/**
 * Refresh access token
 */
export async function refreshOutlookToken(refreshToken: string) {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      refresh_token: refreshToken,
      redirect_uri: MICROSOFT_REDIRECT_URI,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

/**
 * Get user's email address
 */
export async function getOutlookUserInfo(accessToken: string) {
  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  const data = await response.json();
  return {
    email: data.mail || data.userPrincipalName || '',
  };
}

/**
 * Fetch emails from Outlook
 */
export async function fetchOutlookMessages(accessToken: string, maxResults: number = 50) {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=${maxResults}&$select=id,subject,from,toRecipients,ccRecipients,bccRecipients,bodyPreview,body,receivedDateTime,hasAttachments,attachments`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  const data = await response.json();
  return data.value || [];
}

/**
 * Parse Outlook message to extract email data
 */
export function parseOutlookMessage(message: any) {
  const from = message.from?.emailAddress?.address || '';
  const to = message.toRecipients?.map((r: any) => r.emailAddress?.address).join(', ') || '';
  const cc = message.ccRecipients?.map((r: any) => r.emailAddress?.address).join(', ') || '';
  const bcc = message.bccRecipients?.map((r: any) => r.emailAddress?.address).join(', ') || '';

  const body = message.body?.content || message.bodyPreview || '';
  const htmlBody = message.body?.contentType === 'html' ? message.body.content : '';

  // Parse attachments
  const attachments = message.hasAttachments && message.attachments
    ? message.attachments.map((att: any) => ({
        name: att.name,
        contentType: att.contentType,
        size: att.size,
      }))
    : [];

  return {
    messageId: message.id,
    subject: message.subject || '',
    from,
    to,
    cc,
    bcc,
    date: message.receivedDateTime,
    body: body.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text
    htmlBody,
    attachments: JSON.stringify(attachments),
  };
}

