"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Setup2FAPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string>("");
  const [manualKey, setManualKey] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    setup2FA();
  }, []);

  async function setup2FA() {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/auth/2fa/setup", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setQrCode(data.data.qrCode);
        setManualKey(data.data.manualEntryKey);
      } else {
        toast.error(data.message || "Failed to set up 2FA");
        router.push("/home");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to set up 2FA");
      router.push("/home");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerify() {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    try {
      setIsVerifying(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await response.json();

      if (data.success) {
        setBackupCodes(data.data.backupCodes);
        setShowBackupCodes(true);
        toast.success("2FA enabled successfully!");
      } else {
        toast.error(data.message || "Verification failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to verify");
    } finally {
      setIsVerifying(false);
    }
  }

  function handleContinue() {
    router.push("/home");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Setting up 2FA...</p>
        </div>
      </div>
    );
  }

  if (showBackupCodes) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-[#151515] rounded-2xl p-8 border border-[#1E1E1E]">
            <h1 className="text-2xl font-bold mb-2">Save Your Backup Codes</h1>
            <p className="text-gray-400 mb-6 text-sm">
              Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </p>

            <div className="bg-[#000] rounded-lg p-4 mb-4 border border-[#1E1E1E]">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-[#1E1E1E] rounded text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="w-full bg-white text-black rounded-lg py-3 font-medium hover:bg-gray-200 transition-colors"
            >
              I've Saved These Codes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#151515] rounded-2xl p-8 border border-[#1E1E1E]">
          <h1 className="text-2xl font-bold mb-2">Secure Your Account</h1>
          <p className="text-gray-400 mb-6 text-sm">
            Enable two-factor authentication to add an extra layer of security to your account.
          </p>

          <div className="space-y-6">
            {/* QR Code */}
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">Scan this QR code with your authenticator app:</p>
              <div className="bg-white p-4 rounded-lg inline-block">
                {qrCode && (
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                )}
              </div>
            </div>

            {/* Manual Entry Key */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Or enter this key manually:</p>
              <div className="bg-[#000] rounded-lg p-3 border border-[#1E1E1E]">
                <code className="text-sm font-mono break-all">{manualKey}</code>
              </div>
            </div>

            {/* Verification Code Input */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Enter verification code from your app
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
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full bg-white text-black rounded-lg py-3 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? "Verifying..." : "Enable 2FA"}
            </button>

            <button
              onClick={handleContinue}
              className="w-full text-gray-400 hover:text-white text-sm"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




