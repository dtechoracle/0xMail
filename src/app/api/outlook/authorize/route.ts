import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth';
import { getOutlookAuthUrl } from '@/lib/outlook-oauth';

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

    // Generate OAuth URL with user ID as state
    const authUrl = getOutlookAuthUrl(user.id);

    return NextResponse.json(
      {
        success: true,
        data: { authUrl },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Outlook authorize error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

