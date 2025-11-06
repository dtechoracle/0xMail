import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUser, generateToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Authenticate user
    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Check if email is verified
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        twoFactorEnabled: true,
      },
    });

    if (!fullUser?.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please verify your email before logging in',
        },
        { status: 403 }
      );
    }

    // If 2FA is enabled, require verification before issuing full token
    if (fullUser.twoFactorEnabled) {
      // Generate a temporary token for 2FA verification
      const tempToken = generateToken({
        userId: user.id,
        email: user.email,
      });

      return NextResponse.json(
        {
          success: true,
          message: '2FA verification required',
          data: {
            requires2FA: true,
            tempToken, // Temporary token for 2FA verification
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
          },
        },
        { status: 200 }
      );
    }

    // Generate JWT token (no 2FA required)
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          token,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during login',
      },
      { status: 500 }
    );
  }
}

