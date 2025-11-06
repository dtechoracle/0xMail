import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendVerificationOTP(email: string, otp: string) {
  if (!resend) {
    console.error('Resend API key not configured');
    throw new Error('Email service not configured');
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@mail0x.com',
      to: email,
      subject: 'Verify your 0xMail account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #000;">Verify your email</h1>
          <p style="color: #333; font-size: 16px;">Your verification code is:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h2 style="color: #000; font-size: 32px; letter-spacing: 4px; margin: 0; font-family: monospace;">${otp}</h2>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}




