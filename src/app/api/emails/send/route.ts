import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth';
import { z } from 'zod';

const sendSchema = z.object({
  to: z.string().min(3, 'Recipient is required'),
  subject: z.string().optional(),
  body: z.string().min(1, 'Email body is required'),
  cc: z.string().optional(),
  bcc: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const user = await getUserFromAuth(authHeader);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const json = await request.json();
    const parsed = sendSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { to, subject, body, cc, bcc } = parsed.data;

    // TODO: integrate with provider (Gmail/Outlook) to actually send
    // For now, simulate success
    return NextResponse.json(
      {
        success: true,
        message: 'Email sent',
        data: {
          to,
          subject: subject || '',
          body,
          cc,
          bcc,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}






