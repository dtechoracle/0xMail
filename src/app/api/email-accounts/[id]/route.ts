import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!emailAccount) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email account not found',
        },
        { status: 404 }
      );
    }

    await prisma.emailAccount.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email account disconnected successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete email account error:', error);
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
  { params }: { params: { id: string } }
) {
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
    const { isActive } = body;

    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!emailAccount) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email account not found',
        },
        { status: 404 }
      );
    }

    const updated = await prisma.emailAccount.update({
      where: { id: params.id },
      data: {
        ...(typeof isActive === 'boolean' && { isActive }),
      },
      select: {
        id: true,
        provider: true,
        email: true,
        isActive: true,
        lastSyncedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email account updated successfully',
        data: { emailAccount: updated },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update email account error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

