import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const replySchema = z.object({
  body: z.string().min(1, 'Reply body is required'),
  cc: z.string().optional(),
  bcc: z.string().optional(),
});

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
    const validation = replySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { body: replyBody, cc, bcc } = validation.data;

    // Get the original email
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

    // In a real implementation, you would:
    // 1. Get the user's connected email account
    // 2. Use the appropriate email service (Gmail/Outlook) API to send the reply
    // 3. Store the sent email in the database

    // For now, we'll just return success
    return NextResponse.json(
      {
        success: true,
        message: 'Reply sent successfully',
        data: {
          originalEmailId: params.id,
          reply: {
            to: email.from,
            subject: `Re: ${email.subject}`,
            body: replyBody,
            cc,
            bcc,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send reply error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while sending reply',
      },
      { status: 500 }
    );
  }
}








