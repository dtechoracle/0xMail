import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import speakeasy from 'speakeasy';

const verifySchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
  tempToken: z.string().min(1, 'Temporary token is required'),
});

export async function POST(request: NextRequest) {
  try {
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

    const { token, tempToken } = validation.data;

    // Verify temporary token
    const payload = verifyToken(tempToken);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired temporary token',
        },
        { status: 401 }
      );
    }

    // Get user with 2FA secret
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        {
          success: false,
          message: '2FA is not enabled for this account',
        },
        { status: 400 }
      );
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        {
          success: false,
          message: '2FA secret not found. Please set up 2FA again.',
        },
        { status: 400 }
      );
    }

    // Check if it's a backup code first
    let isValidToken = false;
    if (user.twoFactorBackupCodes) {
      try {
        const backupCodes = JSON.parse(user.twoFactorBackupCodes) as string[];
        const codeIndex = backupCodes.indexOf(token);
        if (codeIndex !== -1) {
          // Remove used backup code
          backupCodes.splice(codeIndex, 1);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              twoFactorBackupCodes: JSON.stringify(backupCodes),
            },
          });
          isValidToken = true;
        }
      } catch (error) {
        // Not a backup code, continue with TOTP verification
      }
    }

    // If not a backup code, verify as TOTP
    if (!isValidToken) {
      isValidToken = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps before/after
      });
    }

    if (!isValidToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid verification code',
        },
        { status: 400 }
      );
    }

    // Generate final JWT token
    const { generateToken } = await import('@/lib/auth');
    const finalToken = generateToken({
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: '2FA verified successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          token: finalToken,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA login verify error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

