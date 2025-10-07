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

    const skip = (page - 1) * limit;

    const [quarantinedEmails, total] = await Promise.all([
      prisma.quarantinedEmail.findMany({
        where: { userId: user.id },
        include: {
          email: {
            select: {
              id: true,
              messageId: true,
              subject: true,
              from: true,
              to: true,
              body: true,
              receivedAt: true,
              threatScore: true,
              threatLevel: true,
              threatFlags: true,
            },
          },
        },
        orderBy: { quarantinedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quarantinedEmail.count({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          quarantinedEmails: quarantinedEmails.map((q) => ({
            ...q,
            reason: q.reason ? JSON.parse(q.reason) : [],
            email: {
              ...q.email,
              threatFlags: q.email.threatFlags
                ? JSON.parse(q.email.threatFlags)
                : [],
            },
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
    console.error('Get quarantine error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

