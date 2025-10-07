"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { EmailListSkeleton } from "@/components/ui/Skeleton";

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: string;
  threatLevel: "safe" | "suspicious" | "malicious";
  threatScore: number;
  threatFlags: string[];
  isStarred: boolean;
  isRead: boolean;
}

export default function StarredPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<Email[]>([]);

  useEffect(() => {
    loadStarredEmails();
  }, []);

  // Load starred emails
  async function loadStarredEmails() {
    try {
      setLoading(true);
      const response = await apiClient.getEmails({
        page: 1,
        limit: 50,
        starred: true,
      });

      if (response.success) {
        setEmails(response.data.emails);
      }
    } catch (error: any) {
      console.error("Load starred emails error:", error);
      if (error.message === "Unauthorized") {
        router.push("/auth/login");
      } else {
        toast.error(error.message || "Failed to load starred emails");
      }
    } finally {
      setLoading(false);
    }
  }

  // Toggle star on an email
  async function toggleStar(emailId: string) {
    try {
      const existing = emails.find((e) => e.id === emailId);
      if (!existing) return;

      await apiClient.updateEmail(emailId, { isStarred: false });
      // Remove from starred list
      setEmails((prev) => prev.filter((e) => e.id !== emailId));
      toast.success("Removed from starred");
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
    }
  }

  // Delete an email
  async function deleteEmail(emailId: string) {
    try {
      await apiClient.deleteEmail(emailId);
      setEmails((prev) => prev.filter((e) => e.id !== emailId));
      toast.success("Email deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete email");
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe":
        return "text-green-500";
      case "malicious":
        return "text-red-500";
      case "suspicious":
        return "text-yellow-500";
      default:
        return "text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "safe":
        return "✔";
      case "malicious":
        return "✖";
      case "suspicious":
        return "⚠";
      default:
        return "●";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen text-white p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="h-8 w-48 bg-[#1E1E1E] rounded animate-pulse mb-2"></div>
            <div className="h-5 w-64 bg-[#1E1E1E] rounded animate-pulse"></div>
          </div>

          {/* Emails Section Skeleton */}
          <div className="rounded-xl border border-[#1E1E1E]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-[#1E1E1E] bg-[#151515] gap-3">
              <div className="h-6 w-32 bg-[#1E1E1E] rounded animate-pulse"></div>
              <div className="h-9 w-24 bg-[#1E1E1E] rounded animate-pulse"></div>
            </div>

            {/* Email List Skeleton */}
            <EmailListSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Starred Emails</h1>
          <p className="text-white">
            Your important emails marked with a star
          </p>
        </div>

        {/* Emails Section */}
        <div className="rounded-xl border border-[#1E1E1E]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-[#1E1E1E] bg-[#151515] gap-3">
            <h2 className="text-xl font-semibold">
              {emails.length} Starred {emails.length === 1 ? "Email" : "Emails"}
            </h2>
            <button
              onClick={loadStarredEmails}
              className="flex items-center gap-2 px-3 py-2 bg-black hover:bg-[#1E1E1E] rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-sm">Refresh</span>
            </button>
          </div>

          {/* Email List */}
          <div className="divide-y divide-[#1E1E1E] bg-black">
            {emails.length === 0 ? (
              <div className="text-center py-16">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                <h3 className="text-xl font-semibold mb-2">No starred emails</h3>
                <p className="text-white mb-4">
                  Star important emails to find them quickly here
                </p>
                <button
                  onClick={() => router.push("/home")}
                  className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Go to Inbox
                </button>
              </div>
            ) : (
              emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => router.push(`/home/${email.id}`)}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 hover:bg-[#1E1E1E] transition-colors cursor-pointer"
                >
                  {/* Status Indicator & Sender */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={`${getStatusColor(email.threatLevel)} text-2xl`}>
                      {getStatusIcon(email.threatLevel)}
                    </div>
                    <div className="flex-1 sm:w-48">
                      <p className="font-medium">{email.from.split("<")[0].trim()}</p>
                      <span className={`text-sm ${getStatusColor(email.threatLevel)}`}>
                        {email.threatLevel.charAt(0).toUpperCase() + email.threatLevel.slice(1)}
                      </span>
                    </div>
                    {/* Time - Mobile */}
                    <span className="text-sm text-white sm:hidden">
                      {formatTime(email.receivedAt)}
                    </span>
                  </div>

                  {/* Subject & Preview */}
                  <div className="flex-1 w-full">
                    <p className="font-medium mb-1">{email.subject}</p>
                    <p className="text-sm text-white line-clamp-2">
                      {email.body.substring(0, 150)}...
                    </p>
                    {/* Tags */}
                    {email.threatFlags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {email.threatFlags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-red-900/30 text-red-400 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Time & Actions - Desktop */}
                  <div className="hidden sm:flex items-center gap-4">
                    <span className="text-sm text-white">{formatTime(email.receivedAt)}</span>
                    <button
                      className="text-yellow-500 hover:text-yellow-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(email.id);
                      }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                    <button
                      className="text-white hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEmail(email.id);
                      }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

