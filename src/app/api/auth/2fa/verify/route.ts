import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import speakeasy from 'speakeasy';

const verifySchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
});

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        {
          success: false,
          message: '2FA secret not found. Please set up 2FA first.',
        },
        { status: 400 }
      );
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after
    });

    if (!verified) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid verification code',
        },
        { status: 400 }
      );
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.floor(10000000 + Math.random() * 90000000).toString()
    );

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: '2FA enabled successfully',
        data: {
          backupCodes,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

