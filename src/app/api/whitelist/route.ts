import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const { email, domain, reason } = body;

    if (!email && !domain) {
      return NextResponse.json(
        {
          success: false,
          message: 'Either email or domain is required',
        },
        { status: 400 }
      );
    }

    // Create whitelist entry
    const whitelistEntry = await prisma.whitelist.create({
      data: {
        userId: user.id,
        email: email || null,
        domain: domain || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Sender marked as safe',
        data: { whitelistEntry },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Whitelist error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to whitelist sender',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const whitelistEntries = await prisma.whitelist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      {
        success: true,
        data: { whitelist: whitelistEntries },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get whitelist error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch whitelist',
      },
      { status: 500 }
    );
  }
}







