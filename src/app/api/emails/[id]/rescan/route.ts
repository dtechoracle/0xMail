import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scanEmail } from '@/lib/ai-scanner';
import { getUserFromAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log('Starting rescan for email:', id);

    const authHeader = request.headers.get('Authorization');
    const user = await getUserFromAuth(authHeader);

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const email = await prisma.email.findUnique({
      where: { id },
    });

    if (!email) {
      console.log('Email not found:', id);
      return NextResponse.json({ success: false, message: 'Email not found' }, { status: 404 });
    }

    console.log('Email found, starting scan...', { from: email.from, subject: email.subject });

    // Trigger scan to (re)generate analysis including summary
    const scanResult = await scanEmail(email.id, {
      from: email.from,
      subject: email.subject,
      body: email.body || '',
      htmlBody: email.htmlBody || undefined,
      spfResult: email.spfResult || undefined,
      dkimResult: email.dkimResult || undefined,
      dmarcResult: email.dmarcResult || undefined,
    }, user.id);

    console.log('Scan completed successfully:', scanResult);

    return NextResponse.json({ success: true, data: scanResult }, { status: 200 });
  } catch (error: any) {
    console.error('Rescan error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to rescan email' },
      { status: 500 }
    );
  }
}


