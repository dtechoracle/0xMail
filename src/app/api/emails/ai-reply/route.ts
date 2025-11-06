import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth';
import OpenAI from 'openai';
import { z } from 'zod';

const aiReplySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  // Allow prompt-only drafting by making context optional
  emailBody: z.string().optional(),
  emailSubject: z.string().optional(),
  emailFrom: z.string().optional(),
});

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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

    if (!openai) {
      return NextResponse.json(
        {
          success: false,
          message: 'AI service not configured',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validation = aiReplySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { prompt, emailBody, emailSubject, emailFrom } = validation.data;

    // Generate AI reply using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI email assistant helping users compose professional email replies. Generate a clear, concise, and professional email response based on the user's prompt and the original email context. Only return the email body text without greetings like "Dear" or signatures.`,
        },
        {
          role: 'user',
          content: emailBody
            ? `Original Email:
From: ${emailFrom || 'Unknown Sender'}
Subject: ${emailSubject || 'No Subject'}

Body:
${emailBody}

---

User's instructions for the reply: ${prompt}

Generate a professional email reply based on these instructions.`
            : `No original email context provided.

User's instructions: ${prompt}

Generate a professional email draft that could be sent as a new email.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const generatedReply = completion.choices[0]?.message?.content || '';

    return NextResponse.json(
      {
        success: true,
        data: {
          reply: generatedReply,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('AI reply generation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'An error occurred while generating reply',
      },
      { status: 500 }
    );
  }
}

