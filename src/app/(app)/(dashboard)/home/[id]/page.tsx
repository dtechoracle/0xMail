"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { EmailDetailSkeleton } from "@/components/ui/Skeleton";

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [email, setEmail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(true);

  useEffect(() => {
    fetchEmailDetails();
  }, [params.id]);

  async function fetchEmailDetails() {
    try {
      setLoading(true);
      const response = await apiClient.getEmail(params.id as string);

      if (response.success) {
        setEmail(response.data.email);
      }
    } catch (error: any) {
      console.error("Fetch email error:", error);
      if (error.message === "Unauthorized") {
        router.push("/auth/login");
      } else {
        toast.error("Email not found");
        router.back();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleStar() {
    try {
      await apiClient.updateEmail(params.id as string, {
        isStarred: !email.isStarred,
      });
      setEmail({ ...email, isStarred: !email.isStarred });
      toast.success(email.isStarred ? "Removed from starred" : "Added to starred");
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this email?")) {
      return;
    }

    try {
      await apiClient.deleteEmail(params.id as string);
      toast.success("Email deleted successfully");
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete email");
    }
  }

  if (loading) {
    return (
      <div className="bg-black min-h-screen text-white p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="h-10 w-40 bg-[#1E1E1E] rounded animate-pulse"></div>
            <div className="h-10 w-48 bg-[#1E1E1E] rounded animate-pulse"></div>
          </div>

          {/* Content Skeleton */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <EmailDetailSkeleton />
            </div>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                  <div className="h-5 w-32 bg-[#1E1E1E] rounded animate-pulse mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-[#1E1E1E] rounded animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-[#1E1E1E] rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="text-center py-10">
        <p>Email not found.</p>
        <button onClick={() => router.back()} className="text-blue-500 mt-4">
          Go Back
        </button>
      </div>
    );
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

  const getThreatLevel = (score: number) => {
    if (score >= 70)
      return { level: "Critical", color: "bg-red-500/20 text-red-400" };
    if (score >= 40)
      return { level: "High", color: "bg-orange-500/20 text-orange-400" };
    if (score >= 20)
      return { level: "Medium", color: "bg-yellow-500/20 text-yellow-400" };
    return { level: "Low", color: "bg-green-500/10 text-green-400" };
  };

  const threatLevel = getThreatLevel(email.threatScore);

  return (
    <div className="bg-black min-h-screen text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button and Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Inbox</span>
          </button>

          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="flex items-center gap-2 px-4 py-2 bg-[#151515] hover:bg-[#1E1E1E] rounded-lg transition-colors border border-[#1E1E1E]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>{showAnalysis ? "Hide" : "Show"} Analysis</span>
          </button>
        </div>

        <div
          className={`grid gap-6 ${showAnalysis ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}
        >
          {/* Email Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Email Header */}
            <div className="bg-[#151515] rounded-xl p-4 sm:p-6 border border-[#1E1E1E]">
              <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{email.subject}</h1>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-medium ${getStatusColor(email.threatLevel)}`}>
                      {email.threatLevel.charAt(0).toUpperCase() + email.threatLevel.slice(1)}
                    </span>
                    <span className="text-white text-sm">
                      | {new Date(email.receivedAt).toLocaleString()}
                    </span>
                  </div>
                  {email.threatFlags && email.threatFlags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {email.threatFlags.map((tag: string, index: number) => (
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
                <button onClick={handleStar} className="text-white hover:text-white flex-shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill={email.isStarred ? "currentColor" : "none"}
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
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1E1E1E] rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{email.from.split("<")[0].trim()}</p>
                  <p className="text-sm text-white">{email.from}</p>
                </div>
              </div>
            </div>

            {/* Message Content */}
            <div className="bg-[#151515] rounded-xl p-4 sm:p-6 border border-[#1E1E1E]">
              <p className="text-white leading-relaxed whitespace-pre-wrap">{email.body}</p>
            </div>
          </div>

          {/* Threat Analysis Sidebar */}
          {showAnalysis && email.analysis && (
            <div className="space-y-6">
              {/* Threat Score */}
              <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                <h2 className="text-lg font-semibold mb-4">Threat Assessment</h2>
                <div className={`${threatLevel.color} rounded-lg p-4 text-center mb-4`}>
                  <p className="text-sm mb-2">Threat Level</p>
                  <p className="text-2xl font-bold">{threatLevel.level}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Threat Score:</span>
                  <span className="font-medium">{email.threatScore}/100</span>
                </div>
              </div>

              {/* Email Authentication */}
              <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                <h2 className="text-lg font-semibold mb-4">Email Authentication</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>SPF Check:</span>
                    <span
                      className={`${email.spfResult === "pass" ? "text-green-500" : "text-red-500"} font-medium`}
                    >
                      {email.spfResult === "pass" ? "Pass" : "Fail"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>DKIM Check:</span>
                    <span
                      className={`${email.dkimResult === "pass" ? "text-green-500" : "text-red-500"} font-medium`}
                    >
                      {email.dkimResult === "pass" ? "Pass" : "Fail"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>DMARC Check:</span>
                    <span
                      className={`${email.dmarcResult === "pass" ? "text-green-500" : "text-red-500"} font-medium`}
                    >
                      {email.dmarcResult === "pass" ? "Pass" : "Fail"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Link Analysis */}
              {email.analysis && (
                <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                  <h2 className="text-lg font-semibold mb-4">Link Analysis</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Total Links:</span>
                      <span className="font-medium">{email.analysis.totalLinks}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Suspicious Links:</span>
                      <span className="text-yellow-500 font-medium">
                        {email.analysis.suspiciousLinks}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Phishing Links:</span>
                      <span className="text-red-500 font-medium">
                        {email.analysis.phishingLinks}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Flags */}
              {email.analysis && email.analysis.aiReasoningFlags && (
                <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                  <h2 className="text-lg font-semibold mb-4">AI Analysis Flags</h2>
                  <div className="flex flex-wrap gap-2">
                    {email.analysis.aiReasoningFlags.map((flag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-900/30 text-red-400 text-xs rounded-lg"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Confidence */}
              {email.analysis && (
                <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                  <h2 className="text-lg font-semibold mb-4">AI Analysis</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>AI Prediction:</span>
                      <span
                        className={`font-medium capitalize ${getStatusColor(email.analysis.aiPrediction || "safe")}`}
                      >
                        {email.analysis.aiPrediction || "Safe"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Confidence Score:</span>
                      <span className="font-medium">
                        {((email.analysis.aiConfidenceScore || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                <h2 className="text-lg font-semibold mb-4">Actions</h2>
                <div className="space-y-3">
                  {email.quarantine && (
                    <button
                      onClick={async () => {
                        try {
                          await apiClient.quarantineAction(email.quarantine.id, "release");
                          alert("Email released from quarantine");
                          router.push("/home");
                        } catch (error: any) {
                          alert(error.message || "Failed to release email");
                        }
                      }}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Release from Quarantine
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Delete Email
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
