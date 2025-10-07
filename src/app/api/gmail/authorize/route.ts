import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth';
import { getGmailAuthUrl } from '@/lib/gmail-oauth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const user = await getUserFromAuth(authHeader);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Check if Gmail credentials are configured
    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: 'Gmail API credentials not configured. Please add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET to your .env.local file. See EMAIL_INTEGRATION_GUIDE.md for setup instructions.',
        },
        { status: 500 }
      );
    }

    // Generate OAuth URL with user ID as state
    const authUrl = getGmailAuthUrl(user.id);

    return NextResponse.json(
      {
        success: true,
        data: { authUrl },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Gmail authorize error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to generate Gmail authorization URL',
      },
      { status: 500 }
    );
  }
}

