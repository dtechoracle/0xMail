import { google } from 'googleapis';

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/gmail/callback';

// Scopes for Gmail API
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
];

/**
 * Create OAuth2 client
 */
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI
  );
}

/**
 * Generate authorization URL for Gmail OAuth
 */
export function getGmailAuthUrl(userId: string) {
  const oauth2Client = createOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: userId, // Pass userId to retrieve after callback
    prompt: 'consent', // Force consent screen to get refresh token
  });

  return authUrl;
}

/**
 * Exchange authorization code for tokens
 */
export async function getGmailTokens(code: string) {
  const oauth2Client = createOAuth2Client();

  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Get user's Gmail address
 */
export async function getGmailUserInfo(accessToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });

  return {
    email: profile.data.emailAddress || '',
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshGmailToken(refreshToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

/**
 * Fetch emails from Gmail
 */
export async function fetchGmailMessages(
  accessToken: string,
  refreshToken: string,
  maxResults: number = 50
) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Get list of message IDs
  const messagesResponse = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: 'in:inbox', // Only fetch inbox emails
  });

  const messages = messagesResponse.data.messages || [];

  // Fetch full message details
  const fullMessages = await Promise.all(
    messages.map(async (message) => {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full',
      });
      return msg.data;
    })
  );

  return fullMessages;
}

/**
 * Parse Gmail message to extract email data
 */
export function parseGmailMessage(message: any) {
  const headers = message.payload?.headers || [];

  const getHeader = (name: string) => {
    const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
    return header?.value || '';
  };

  // Get email body
  let body = '';
  let htmlBody = '';

  const getBody = (payload: any): void => {
    if (payload.body?.data) {
      const decoded = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      if (payload.mimeType === 'text/html') {
        htmlBody = decoded;
      } else {
        body = decoded;
      }
    }

    if (payload.parts) {
      payload.parts.forEach((part: any) => getBody(part));
    }
  };

  getBody(message.payload);

  // Parse attachments
  const attachments: any[] = [];
  const parseAttachments = (payload: any): void => {
    if (payload.filename && payload.body?.attachmentId) {
      attachments.push({
        filename: payload.filename,
        mimeType: payload.mimeType,
        size: payload.body.size,
        attachmentId: payload.body.attachmentId,
      });
    }

    if (payload.parts) {
      payload.parts.forEach((part: any) => parseAttachments(part));
    }
  };

  parseAttachments(message.payload);

  return {
    messageId: message.id!,
    threadId: message.threadId!,
    subject: getHeader('Subject'),
    from: getHeader('From'),
    to: getHeader('To'),
    cc: getHeader('Cc'),
    bcc: getHeader('Bcc'),
    date: getHeader('Date'),
    body: body || htmlBody,
    htmlBody,
    labels: message.labelIds || [],
    attachments: JSON.stringify(attachments),
    // Email authentication headers
    spfResult: getHeader('Received-SPF'),
    dkimResult: getHeader('DKIM-Signature'),
    dmarcResult: getHeader('Authentication-Results'),
  };
}

