import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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
    const { action } = body; // 'release', 'delete', 'block_sender'

    const quarantined = await prisma.quarantinedEmail.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        email: true,
      },
    });

    if (!quarantined) {
      return NextResponse.json(
        {
          success: false,
          message: 'Quarantined email not found',
        },
        { status: 404 }
      );
    }

    switch (action) {
      case 'release':
        // Remove from quarantine and update email status
        await prisma.$transaction([
          prisma.email.update({
            where: { id: quarantined.emailId },
            data: { threatLevel: 'safe' },
          }),
          prisma.quarantinedEmail.update({
            where: { id: params.id },
            data: {
              reviewedAt: new Date(),
              reviewedBy: user.id,
              action: 'released',
            },
          }),
        ]);

        return NextResponse.json(
          {
            success: true,
            message: 'Email released from quarantine',
          },
          { status: 200 }
        );

      case 'delete':
        // Delete email and quarantine record
        await prisma.email.delete({
          where: { id: quarantined.emailId },
        });

        return NextResponse.json(
          {
            success: true,
            message: 'Email deleted permanently',
          },
          { status: 200 }
        );

      case 'block_sender':
        // Add sender to blacklist and delete email
        const senderEmail = quarantined.email.from.match(
          /<(.+?)>|^(.+?)$/
        )?.[1] || quarantined.email.from;

        await prisma.$transaction([
          prisma.blacklist.upsert({
            where: {
              userId_email: {
                userId: user.id,
                email: senderEmail,
              },
            },
            create: {
              userId: user.id,
              email: senderEmail,
              reason: 'Blocked from quarantine',
            },
            update: {},
          }),
          prisma.email.delete({
            where: { id: quarantined.emailId },
          }),
        ]);

        return NextResponse.json(
          {
            success: true,
            message: 'Sender blocked and email deleted',
          },
          { status: 200 }
        );

      default:
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid action',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Quarantine action error:', error);
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

    const quarantined = await prisma.quarantinedEmail.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!quarantined) {
      return NextResponse.json(
        {
          success: false,
          message: 'Quarantined email not found',
        },
        { status: 404 }
      );
    }

    // Delete the email (cascade will delete quarantine record)
    await prisma.email.delete({
      where: { id: quarantined.emailId },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email deleted permanently',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete quarantine error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

