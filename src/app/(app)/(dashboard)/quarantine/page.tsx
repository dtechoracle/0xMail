"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { QuarantineListSkeleton } from "@/components/ui/Skeleton";

export default function QuarantinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<any[]>([]);

  useEffect(() => {
    loadQuarantinedEmails();
  }, []);

  async function loadQuarantinedEmails() {
    try {
      setLoading(true);
      const response = await apiClient.getQuarantinedEmails({ page: 1, limit: 30 });

      if (response.success) {
        setEmails(response.data.quarantinedEmails);
      }
    } catch (error: any) {
      console.error("Load quarantine error:", error);
      if (error.message === "Unauthorized") {
        router.push("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRelease(id: string) {
    if (!confirm("Are you sure you want to release this email from quarantine?")) {
      return;
    }

    try {
      const response = await apiClient.quarantineAction(id, "release");
      if (response.success) {
        toast.success("Email released and moved back to your inbox");
        loadQuarantinedEmails();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to release email");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this email?")) {
      return;
    }

    try {
      const response = await apiClient.deleteQuarantinedEmail(id);
      if (response.success) {
        toast.success("Email permanently deleted");
        loadQuarantinedEmails();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete email");
    }
  }

  async function handleBlockSender(id: string) {
    if (!confirm("Block this sender and delete the email?")) {
      return;
    }

    try {
      const response = await apiClient.quarantineAction(id, "block_sender");
      if (response.success) {
        toast.success("Sender blocked and added to blacklist");
        loadQuarantinedEmails();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to block sender");
    }
  }

  const getThreatColor = (score: number) => {
    if (score >= 80) return "text-red-500";
    if (score >= 60) return "text-orange-500";
    return "text-yellow-500";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen text-white p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <div className="h-8 w-40 bg-[#1E1E1E] rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-[#1E1E1E] rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-[#1E1E1E] rounded animate-pulse"></div>
          </div>

          {/* Quarantine List Skeleton */}
          <QuarantineListSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Quarantine</h1>
            <p className="text-white">
              Suspicious and malicious emails are automatically quarantined for your safety
            </p>
          </div>
          <button
            onClick={loadQuarantinedEmails}
            className="flex items-center gap-2 px-4 py-2 bg-[#151515] hover:bg-[#1E1E1E] rounded-lg transition-colors border border-[#1E1E1E]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {/* Quarantined Emails List */}
        <div className="space-y-4">
          {emails.length === 0 ? (
            <div className="bg-[#151515] rounded-xl p-12 border border-[#1E1E1E] text-center">
              <svg
                className="w-16 h-16 text-green-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
              <p className="text-white">No quarantined emails. Your inbox is secure.</p>
            </div>
          ) : (
            emails.map((item) => (
              <div
                key={item.id}
                className="bg-[#151515] rounded-xl p-4 sm:p-6 border border-[#1E1E1E]"
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Email Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{item.email.subject}</h3>
                        <p className="text-sm text-white mb-2">
                          From: <span className="font-medium">{item.email.from}</span>
                        </p>
                        <p className="text-xs text-white">
                          Quarantined: {formatDate(item.quarantinedAt)}
                        </p>
                      </div>
                      <div className={`${getThreatColor(item.email.threatScore)} font-bold text-xl`}>
                        {item.email.threatScore}
                      </div>
                    </div>

                    {/* Preview */}
                    <p className="text-sm text-white mb-3 line-clamp-2">
                      {item.email.body.substring(0, 200)}...
                    </p>

                    {/* Threat Reasons */}
                    <div className="flex flex-wrap gap-2">
                      {item.reason.map((reason: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-red-900/30 text-red-400 text-xs rounded"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 lg:w-48">
                    <button
                      onClick={() => handleRelease(item.id)}
                      className="flex-1 lg:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-sm"
                    >
                      Release
                    </button>
                    <button
                      onClick={() => handleBlockSender(item.id)}
                      className="flex-1 lg:flex-none px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors text-sm"
                    >
                      Block Sender
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 lg:flex-none px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
