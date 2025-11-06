"use client";

import { useState, Suspense } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleVerify() {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    try {
      setIsVerifying(true);
      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Email verified successfully!");
        
        // Check if user needs 2FA setup (new users)
        if (data.data?.requires2FASetup) {
          setTimeout(() => {
            router.push("/auth/setup-2fa");
          }, 1000);
        } else {
          // Redirect to login for existing users
          setTimeout(() => {
            router.push("/auth/login?verified=true");
          }, 1000);
        }
      } else {
        toast.error(data.message || "Verification failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to verify email");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!email) {
      toast.error("Email address required");
      return;
    }

    try {
      setIsResending(true);
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Verification code sent to your email");
      } else {
        toast.error(data.message || "Failed to resend code");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#151515] rounded-2xl p-8 border border-[#1E1E1E]">
          <h1 className="text-2xl font-bold mb-2">Verify your email</h1>
          <p className="text-gray-400 mb-6">
            We sent a 6-digit verification code to{" "}
            <span className="text-white font-medium">{email || "your email"}</span>
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Enter verification code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(value);
                }}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-[#FFFFFF0D] rounded-lg px-4 py-3 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-white border border-[#1E1E1E]"
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={isVerifying || otp.length !== 6}
              className="w-full bg-white text-black rounded-lg py-3 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? "Verifying..." : "Verify Email"}
            </button>

            <div className="text-center">
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50"
              >
                {isResending ? "Sending..." : "Resend code"}
              </button>
            </div>

            <div className="text-center pt-4 border-t border-[#1E1E1E]">
              <Link
                href="/auth/login"
                className="text-gray-400 hover:text-white text-sm"
              >
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="bg-[#151515] rounded-2xl p-8 border border-[#1E1E1E]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-gray-400">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}




