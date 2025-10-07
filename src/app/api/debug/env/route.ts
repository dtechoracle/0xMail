import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Simple endpoint to check which env vars are configured
  const envCheck = {
    database: !!process.env.DATABASE_URL,
    jwtSecret: !!process.env.JWT_SECRET,
    nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    gmailClientId: !!process.env.GMAIL_CLIENT_ID,
    gmailClientSecret: !!process.env.GMAIL_CLIENT_SECRET,
    microsoftClientId: !!process.env.MICROSOFT_CLIENT_ID,
    microsoftClientSecret: !!process.env.MICROSOFT_CLIENT_SECRET,
    openaiApiKey: !!process.env.OPENAI_API_KEY,
  };

  const missing = Object.entries(envCheck)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  return NextResponse.json({
    configured: envCheck,
    missing,
    allConfigured: missing.length === 0,
    message: missing.length > 0 
      ? `Missing: ${missing.join(', ')}. Add them to .env.local`
      : 'All environment variables configured!',
  });
}

