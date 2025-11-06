import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

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

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        {
          success: false,
          message: '2FA is already enabled',
        },
        { status: 400 }
      );
    }

    // Generate a secret
    const secret = speakeasy.generateSecret({
      name: `0xMail (${user.email})`,
      issuer: '0xMail',
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Save secret temporarily (don't enable yet - user must verify first)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret.base32,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          secret: secret.base32,
          qrCode: qrCodeUrl,
          manualEntryKey: secret.base32,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

