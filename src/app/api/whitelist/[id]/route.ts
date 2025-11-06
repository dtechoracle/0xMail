import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    // Delete whitelist entry
    await prisma.whitelist.deleteMany({
      where: {
        id: id,
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Sender removed from whitelist',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Remove whitelist error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to remove from whitelist',
      },
      { status: 500 }
    );
  }
}







