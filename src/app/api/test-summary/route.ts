import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scanEmail } from '@/lib/ai-scanner';

export async function GET() {
  try {
    // Get a recent email
    const email = await prisma.email.findFirst({
      orderBy: { receivedAt: 'desc' },
      include: { analysis: true }
    });

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'No emails found'
      });
    }

    return NextResponse.json({
      success: true,
      email: {
        id: email.id,
        subject: email.subject,
        from: email.from,
        hasAnalysis: !!email.analysis,
        aiSummary: email.analysis?.aiSummary || 'NO SUMMARY',
        scanStatus: email.scanStatus
      }
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Get a recent email
    const email = await prisma.email.findFirst({
      orderBy: { receivedAt: 'desc' }
    });

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'No emails found'
      });
    }

    console.log('Testing AI summary generation for email:', email.id);

    // Get user from email (for testing purposes, use the email's userId)
    const userId = email.userId;

    // Force rescan the email
    await scanEmail(email.id, {
      from: email.from,
      subject: email.subject,
      body: email.body,
      htmlBody: email.htmlBody || undefined,
    }, userId);

    // Fetch the updated email
    const updatedEmail = await prisma.email.findUnique({
      where: { id: email.id },
      include: { analysis: true }
    });

    return NextResponse.json({
      success: true,
      before: {
        aiSummary: 'NOT SCANNED'
      },
      after: {
        aiSummary: updatedEmail?.analysis?.aiSummary || 'STILL NO SUMMARY'
      }
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}







