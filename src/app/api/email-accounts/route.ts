import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createEmailAccountSchema = z.object({
  provider: z.enum(['gmail', 'outlook', 'custom']),
  email: z.string().email('Invalid email address'),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

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

    const emailAccounts = await prisma.emailAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        provider: true,
        email: true,
        isActive: true,
        lastSyncedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      {
        success: true,
        data: { emailAccounts },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get email accounts error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

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
    const validation = createEmailAccountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { provider, email, accessToken, refreshToken } = validation.data;

    // Check if this email is already connected
    const existingAccount = await prisma.emailAccount.findFirst({
      where: {
        userId: user.id,
        email,
      },
    });

    if (existingAccount) {
      return NextResponse.json(
        {
          success: false,
          message: 'This email account is already connected',
        },
        { status: 409 }
      );
    }

    const emailAccount = await prisma.emailAccount.create({
      data: {
        userId: user.id,
        provider,
        email,
        accessToken,
        refreshToken,
      },
      select: {
        id: true,
        provider: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email account connected successfully',
        data: { emailAccount },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create email account error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

