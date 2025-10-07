import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const [
      totalProcessed,
      safeEmails,
      suspiciousEmails,
      threatsBlocked,
    ] = await Promise.all([
      prisma.email.count({
        where: { userId: user.id },
      }),
      prisma.email.count({
        where: {
          userId: user.id,
          threatLevel: 'safe',
        },
      }),
      prisma.email.count({
        where: {
          userId: user.id,
          threatLevel: 'suspicious',
        },
      }),
      prisma.email.count({
        where: {
          userId: user.id,
          threatLevel: 'malicious',
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          totalProcessed,
          safeEmails,
          suspiciousEmails,
          threatsBlocked,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

