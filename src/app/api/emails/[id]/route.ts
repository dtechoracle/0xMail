import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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

    const email = await prisma.email.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        analysis: true,
        quarantine: true,
      },
    });

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email not found',
        },
        { status: 404 }
      );
    }

    // Mark as read
    if (!email.isRead) {
      await prisma.email.update({
        where: { id: params.id },
        data: { isRead: true },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          email: {
            ...email,
            threatFlags: email.threatFlags ? JSON.parse(email.threatFlags) : [],
            analysis: email.analysis
              ? {
                  ...email.analysis,
                  maliciousUrls: JSON.parse(email.analysis.maliciousUrls || '[]'),
                  aiReasoningFlags: JSON.parse(email.analysis.aiReasoningFlags || '[]'),
                }
              : null,
            quarantine: email.quarantine
              ? {
                  ...email.quarantine,
                  reason: JSON.parse(email.quarantine.reason || '[]'),
                }
              : null,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get email error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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
    const { isRead, isStarred } = body;

    const email = await prisma.email.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email not found',
        },
        { status: 404 }
      );
    }

    const updated = await prisma.email.update({
      where: { id: params.id },
      data: {
        ...(typeof isRead === 'boolean' && { isRead }),
        ...(typeof isStarred === 'boolean' && { isStarred }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { email: updated },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update email error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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

    const email = await prisma.email.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email not found',
        },
        { status: 404 }
      );
    }

    await prisma.email.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete email error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

