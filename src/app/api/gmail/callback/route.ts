import { NextRequest, NextResponse } from 'next/server';
import { getGmailTokens, getGmailUserInfo } from '@/lib/gmail-oauth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the userId
    const error = searchParams.get('error');

    console.log('Gmail callback received:', { code: !!code, state, error });

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/settings?error=gmail_auth_denied&details=${error}`, request.url)
      );
    }

    if (!code || !state) {
      console.error('Missing code or state:', { code: !!code, state });
      return NextResponse.redirect(
        new URL(`/settings?error=invalid_callback&details=missing_params`, request.url)
      );
    }

    const userId = state;
    console.log('Processing for userId:', userId);

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL(`/settings?error=user_not_found`, request.url)
      );
    }

    // Exchange code for tokens
    console.log('Exchanging code for tokens...');
    const tokens = await getGmailTokens(code);
    console.log('Tokens received:', { hasAccessToken: !!tokens.access_token, hasRefreshToken: !!tokens.refresh_token });

    if (!tokens.access_token) {
      console.error('No access token in response');
      throw new Error('No access token received');
    }

    // Get user's Gmail address
    console.log('Fetching Gmail user info...');
    const gmailInfo = await getGmailUserInfo(tokens.access_token);
    console.log('Gmail info:', gmailInfo);

    // Check if this Gmail account is already connected
    const existingAccount = await prisma.emailAccount.findFirst({
      where: {
        userId,
        email: gmailInfo.email,
      },
    });

    if (existingAccount) {
      console.log('Updating existing account:', existingAccount.id);
      // Update tokens
      await prisma.emailAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existingAccount.refreshToken,
          tokenExpiry: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : null,
        },
      });
    } else {
      console.log('Creating new email account for:', gmailInfo.email);
      // Create new email account
      await prisma.emailAccount.create({
        data: {
          userId,
          provider: 'gmail',
          email: gmailInfo.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : null,
        },
      });
      console.log('Email account created successfully');
    }

    // Redirect back to settings with success
    console.log('Redirecting to settings with success');
    return NextResponse.redirect(
      new URL(`/settings?success=gmail_connected&email=${encodeURIComponent(gmailInfo.email)}`, request.url)
    );
  } catch (error: any) {
    console.error('Gmail callback error:', error);
    const errorMessage = encodeURIComponent(error.message || 'Unknown error');
    return NextResponse.redirect(
      new URL(`/settings?error=gmail_connection_failed&details=${errorMessage}`, request.url)
    );
  }
}

