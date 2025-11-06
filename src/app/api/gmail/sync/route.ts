import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchGmailMessages, parseGmailMessage, refreshGmailToken } from '@/lib/gmail-oauth';
import { scanEmail } from '@/lib/ai-scanner';

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
    const { emailAccountId } = body;

    // Get the email account
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        id: emailAccountId,
        userId: user.id,
        provider: 'gmail',
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

    if (!emailAccount.accessToken || !emailAccount.refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email account not properly configured',
        },
        { status: 400 }
      );
    }

    let accessToken = emailAccount.accessToken;

    // Check if token needs refresh
    if (emailAccount.tokenExpiry && new Date() >= emailAccount.tokenExpiry) {
      const newTokens = await refreshGmailToken(emailAccount.refreshToken);
      accessToken = newTokens.access_token!;

      // Update tokens in database
      await prisma.emailAccount.update({
        where: { id: emailAccount.id },
        data: {
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || emailAccount.refreshToken,
          tokenExpiry: newTokens.expiry_date
            ? new Date(newTokens.expiry_date)
            : null,
        },
      });
    }

    // Fetch messages from Gmail (already sorted by internalDate desc)
    const messages = await fetchGmailMessages(
      accessToken,
      emailAccount.refreshToken,
      50 // Fetch last 50 emails
    );

    let imported = 0;
    let scanned = 0;

    // Process each message
    for (const message of messages) {
      const parsedEmail = parseGmailMessage(message);

      // Check if email already exists; also update receivedAt if changed/newer
      const existingEmail = await prisma.email.findUnique({
        where: { messageId: parsedEmail.messageId },
      });

      if (existingEmail) {
        // If Gmail updated internalDate, ensure our receivedAt reflects it
        const newReceivedAt = new Date(parsedEmail.date || Date.now());
        if (existingEmail.receivedAt.getTime() !== newReceivedAt.getTime()) {
          await prisma.email.update({
            where: { id: existingEmail.id },
            data: { receivedAt: newReceivedAt },
          });
        }
        continue; // Skip content import
      }

      // Create email in database
      const email = await prisma.email.create({
        data: {
          userId: user.id,
          emailAccountId: emailAccount.id,
          messageId: parsedEmail.messageId,
          threadId: parsedEmail.threadId,
          subject: parsedEmail.subject,
          from: parsedEmail.from,
          to: parsedEmail.to,
          cc: parsedEmail.cc,
          bcc: parsedEmail.bcc,
          body: parsedEmail.body,
          htmlBody: parsedEmail.htmlBody,
          // Use internalDate if available for accurate sorting
          receivedAt: new Date(parsedEmail.date || Date.now()),
          labels: JSON.stringify(parsedEmail.labels),
          attachments: parsedEmail.attachments,
          // Email authentication
          spfResult: parsedEmail.spfResult?.includes('pass') ? 'pass' : 'fail',
          dkimResult: parsedEmail.dkimResult ? 'pass' : 'fail',
          dmarcResult: parsedEmail.dmarcResult?.includes('pass') ? 'pass' : 'fail',
        },
      });

      imported++;

      // Scan email for threats - wait for first few emails to ensure summaries are ready
      if (imported <= 10) {
        // Wait for scan to complete for first 10 emails to ensure summaries are ready
        try {
          await scanEmail(email.id, {
            from: parsedEmail.from,
            subject: parsedEmail.subject,
            body: parsedEmail.body,
            htmlBody: parsedEmail.htmlBody,
            spfResult: parsedEmail.spfResult,
            dkimResult: parsedEmail.dkimResult,
            dmarcResult: parsedEmail.dmarcResult,
          });
        } catch (error) {
          console.error('Scan error for email:', email.id, error);
        }
      } else {
        // For remaining emails, scan async to not block the sync
        scanEmail(email.id, {
          from: parsedEmail.from,
          subject: parsedEmail.subject,
          body: parsedEmail.body,
          htmlBody: parsedEmail.htmlBody,
          spfResult: parsedEmail.spfResult,
          dkimResult: parsedEmail.dkimResult,
          dmarcResult: parsedEmail.dmarcResult,
        }).catch((error) => {
          console.error('Scan error for email:', email.id, error);
        });
      }

      scanned++;
    }

    // Update last synced time
    await prisma.emailAccount.update({
      where: { id: emailAccount.id },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Synced ${imported} new emails`,
        data: {
          imported,
          scanned,
          total: messages.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Gmail sync error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during sync',
      },
      { status: 500 }
    );
  }
}

