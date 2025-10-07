import { NextRequest, NextResponse } from 'next/server';
import { getOutlookTokens, getOutlookUserInfo } from '@/lib/outlook-oauth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the userId
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=outlook_auth_denied`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/settings?error=invalid_callback`, request.url)
      );
    }

    const userId = state;

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
    const tokens = await getOutlookTokens(code);

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Get user's Outlook email
    const outlookInfo = await getOutlookUserInfo(tokens.access_token);

    // Check if this Outlook account is already connected
    const existingAccount = await prisma.emailAccount.findFirst({
      where: {
        userId,
        email: outlookInfo.email,
      },
    });

    const expiryDate = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    if (existingAccount) {
      // Update tokens
      await prisma.emailAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existingAccount.refreshToken,
          tokenExpiry: expiryDate,
        },
      });
    } else {
      // Create new email account
      await prisma.emailAccount.create({
        data: {
          userId,
          provider: 'outlook',
          email: outlookInfo.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: expiryDate,
        },
      });
    }

    // Redirect back to settings with success
    return NextResponse.redirect(
      new URL(`/settings?success=outlook_connected&email=${outlookInfo.email}`, request.url)
    );
  } catch (error) {
    console.error('Outlook callback error:', error);
    return NextResponse.redirect(
      new URL(`/settings?error=outlook_connection_failed`, request.url)
    );
  }
}

