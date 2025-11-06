import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one symbol'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User with this email already exists',
        },
        { status: 409 }
      );
    }

    // Create new user
    const user = await createUser(email, password, name);

    // Create default settings for the user
    await prisma.userSettings.create({
      data: {
        userId: user.id,
      },
    });

    // Generate 6-digit OTP for email verification
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

    // Send verification OTP email
    try {
      const { sendVerificationOTP } = await import('@/lib/resend');
      await sendVerificationOTP(email, otp);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Continue anyway - user can request a new OTP
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created. Please check your email for verification code.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: false,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'An error occurred during signup';
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.code === 'P2002') {
      errorMessage = 'User with this email already exists';
    } else if (error?.code === 'P1012') {
      errorMessage = 'Database connection error. Please check your configuration.';
    }
    
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

