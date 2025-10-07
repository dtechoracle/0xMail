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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const status = searchParams.get('status'); // 'safe', 'suspicious', 'malicious'
    const starred = searchParams.get('starred') === 'true';

    const skip = (page - 1) * limit;

    const where: any = {
      userId: user.id,
    };

    if (status) {
      where.threatLevel = status;
    }

    if (starred) {
      where.isStarred = true;
    }

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          messageId: true,
          subject: true,
          from: true,
          to: true,
          body: true,
          receivedAt: true,
          isRead: true,
          isStarred: true,
          threatScore: true,
          threatLevel: true,
          threatFlags: true,
          scanStatus: true,
        },
      }),
      prisma.email.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          emails: emails.map((email) => ({
            ...email,
            threatFlags: email.threatFlags ? JSON.parse(email.threatFlags) : [],
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get emails error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

