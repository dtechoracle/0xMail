"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function Verify2FAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const tempToken = searchParams.get("token") || "";

  async function handleVerify() {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    if (!tempToken) {
      toast.error("Invalid session. Please login again.");
      router.push("/auth/login");
      return;
    }

    try {
      setIsVerifying(true);
      const response = await fetch("/api/auth/2fa/login-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationCode, tempToken }),
      });

      const data = await response.json();

      if (data.success) {
        // Store the final token
        localStorage.setItem("authToken", data.data.token);
        toast.success("2FA verified successfully!");
        setTimeout(() => {
          router.push("/home");
        }, 1000);
      } else {
        toast.error(data.message || "Verification failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to verify");
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#151515] rounded-2xl p-8 border border-[#1E1E1E]">
          <h1 className="text-2xl font-bold mb-2">Two-Factor Authentication</h1>
          <p className="text-gray-400 mb-6 text-sm">
            Enter the 6-digit code from your authenticator app to complete login.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Verification code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setVerificationCode(value);
                }}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-[#FFFFFF0D] rounded-lg px-4 py-3 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-white border border-[#1E1E1E]"
                autoFocus
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full bg-white text-black rounded-lg py-3 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? "Verifying..." : "Verify & Continue"}
            </button>

            <div className="text-center">
              <button
                onClick={() => router.push("/auth/login")}
                className="text-gray-400 hover:text-white text-sm"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

