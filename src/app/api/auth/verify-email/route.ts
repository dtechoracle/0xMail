import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendVerificationOTP } from '@/lib/resend';

const requestOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// Request OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestOTPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email already verified',
        },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationOTP: otp,
        emailVerificationOTPExpires: expiresAt,
      },
    });

    // Send OTP email
    try {
      await sendVerificationOTP(email, otp);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send verification email. Please check your Resend API key configuration.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Verification code sent to your email',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Request OTP error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}

// Verify OTP
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = verifyOTPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { email, otp } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email already verified',
        },
        { status: 400 }
      );
    }

    // Check if OTP matches and is not expired
    if (
      !user.emailVerificationOTP ||
      user.emailVerificationOTP !== otp ||
      !user.emailVerificationOTPExpires ||
      new Date() > user.emailVerificationOTPExpires
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired verification code',
        },
        { status: 400 }
      );
    }

    // Verify email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationOTP: null,
        emailVerificationOTPExpires: null,
      },
    });

    // Check if user is new (created in last 24 hours) and 2FA not enabled
    const isNewUser = 
      user.createdAt && 
      new Date().getTime() - new Date(user.createdAt).getTime() < 24 * 60 * 60 * 1000 &&
      !user.twoFactorEnabled;

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully',
        data: {
          requires2FASetup: isNewUser || false,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred',
      },
      { status: 500 }
    );
  }
}




