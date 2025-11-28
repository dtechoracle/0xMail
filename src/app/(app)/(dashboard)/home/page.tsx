"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { StatsCardsSkeleton, EmailListSkeleton } from "@/components/ui/Skeleton";

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

interface Stats {
  totalProcessed: number;
  safeEmails: number;
  suspiciousEmails: number;
  threatsBlocked: number;
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProcessed: 0,
    safeEmails: 0,
    suspiciousEmails: 0,
    threatsBlocked: 0,
  });
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Navigation handler function - immediate redirect
  const handleEmailClick = (emailId: string) => {
    router.push(`/home/${emailId}`);
  };

  useEffect(() => {
    loadData();
    checkFirstLogin();
    
    // Refresh data when component mounts (e.g., when returning from email detail)
    const handleFocus = () => {
      console.log('Page focused, refreshing data...');
      loadData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };

    // Lightweight live sync: periodically sync active Gmail accounts and refresh list
    const interval = setInterval(async () => {
      await syncEmails(true); // silent sync
    }, 10000); // every 10s for faster updates

    return () => clearInterval(interval);
  }, []);

  // Check if user is new and show modal on first login
  function checkFirstLogin() {
    const hasConnectedAccounts = localStorage.getItem("hasConnectedAccounts");
    const isFirstLogin = localStorage.getItem("isFirstLogin");

    if (isFirstLogin === "true" && !hasConnectedAccounts) {
      setShowAddEmailModal(true);
      localStorage.setItem("isFirstLogin", "false");
    }
  }

  // Load emails and stats
  async function loadData() {
    try {
      setLoading(true);
      const [emailsRes, statsRes] = await Promise.all([
        apiClient.getEmails({ page: 1, limit: 30 }),
        apiClient.getStats(),
      ]);

      if (emailsRes.success) {
        setEmails(emailsRes.data.emails);
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (error: any) {
      console.error("Load data error:", error);
      if (error.message === "Unauthorized") {
        router.push("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  }

  // Manual sync function
  async function syncEmails(silent = false) {
    if (isSyncing) return; // Prevent multiple simultaneous syncs
    
    try {
      if (!silent) {
        setIsSyncing(true);
        toast.info("Syncing emails...");
      }

      const accountsRes = await apiClient.getEmailAccounts();
      const gmailAccounts = (accountsRes?.data?.emailAccounts || [])
        .filter((a: any) => a.provider === 'gmail' && a.isActive);

      for (const acc of gmailAccounts) {
        try {
          await apiClient.syncGmailAccount(acc.id);
        } catch (e) {
          console.error('Sync error for account:', acc.id, e);
        }
      }

      // Refresh inbox after syncs
      const [emailsRes, statsRes] = await Promise.all([
        apiClient.getEmails({ page: 1, limit: 30 }),
        apiClient.getStats(),
      ]);

      if (emailsRes.success) {
        setEmails(emailsRes.data.emails);
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      
      if (!silent) {
        toast.success("Emails synced successfully!");
      }
    } catch (e: any) {
      console.error('Sync error:', e);
      if (!silent) {
        toast.error("Failed to sync emails");
      }
    } finally {
      if (!silent) {
        setIsSyncing(false);
      }
    }
  }

  // Connect Gmail
  async function handleGmailConnect() {
    try {
      const response = await apiClient.getGmailAuthUrl();
      if (response.success) {
        window.location.href = response.data.authUrl;
      }
    } catch (error: any) {
      alert(error.message || "Failed to connect Gmail");
    }
  }

  // Connect Outlook
  async function handleOutlookConnect() {
    try {
      const response = await apiClient.getOutlookAuthUrl();
      if (response.success) {
        window.location.href = response.data.authUrl;
      }
    } catch (error: any) {
      alert(error.message || "Failed to connect Outlook");
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

  // Toggle star on an email
  async function toggleStar(emailId: string) {
    try {
      const existing = emails.find((e) => e.id === emailId);
      if (!existing) return;

      // optimistic update
      setEmails((prev) =>
        prev.map((e) => (e.id === emailId ? { ...e, isStarred: !e.isStarred } : e))
      );

      await apiClient.updateEmail(emailId, { isStarred: !existing.isStarred });
      toast.success(!existing.isStarred ? "Added to starred" : "Removed from starred");
    } catch (error: any) {
      // revert on failure
      setEmails((prev) =>
        prev.map((e) => (e.id === emailId ? { ...e, isStarred: !e.isStarred } : e))
      );
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
          {/* Stats Cards Skeleton */}
          <div className="mb-6">
            <StatsCardsSkeleton />
          </div>

          {/* Emails Section Skeleton */}
          <div className="rounded-xl border border-[#1E1E1E]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-[#1E1E1E] bg-[#151515] gap-3">
              <div className="h-6 w-32 bg-[#1E1E1E] rounded animate-pulse"></div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-24 bg-[#1E1E1E] rounded animate-pulse"></div>
                <div className="h-9 w-24 bg-[#1E1E1E] rounded animate-pulse"></div>
              </div>
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
        {/* Stats Cards */}
        <div className="mb-6">
          <div className="flex overflow-x-auto gap-4 pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-x-visible">
            <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E] min-w-[280px] sm:min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-white text-sm">Total Processed</span>
              </div>
              <p className="text-4xl font-bold">{stats.totalProcessed}</p>
            </div>

            <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E] min-w-[280px] sm:min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white text-sm">Safe Emails</span>
              </div>
              <p className="text-4xl font-bold">{stats.safeEmails}</p>
            </div>

            <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E] min-w-[280px] sm:min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="text-white text-sm">Suspicious</span>
              </div>
              <p className="text-4xl font-bold">{stats.suspiciousEmails}</p>
            </div>

            <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E] min-w-[280px] sm:min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                <span className="text-white text-sm">Threats Blocked</span>
              </div>
              <p className="text-4xl font-bold">{stats.threatsBlocked}</p>
            </div>
          </div>
        </div>

        {/* Emails Section - Gmail Style */}
        <div className="bg-black border border-[#1E1E1E] rounded-lg overflow-hidden">
          {/* Header - Gmail Style */}
          <div className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-[#1E1E1E] bg-[#151515]">
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={() => { window.location.href = '/compose'; }}
                className="bg-white text-black px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Compose
              </button>
              <button
                onClick={() => syncEmails(false)}
                disabled={isSyncing}
                className="p-1.5 hover:bg-[#1E1E1E] rounded transition-colors disabled:opacity-50"
                title="Refresh"
              >
                {isSyncing ? (
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                  </div>
                ) : (
                  <svg
                    className="w-5 h-5 text-white"
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
                )}
              </button>
            </div>
            <span className="text-xs text-gray-400 hidden sm:block">
              {emails.length} of {stats.totalProcessed}
            </span>
          </div>

          {/* Email List - Gmail Style Compact */}
          <div className="divide-y divide-[#1E1E1E]">
            {emails.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No emails yet</p>
                <button
                  onClick={() => setShowAddEmailModal(true)}
                  className="bg-white text-black px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Connect Email Account
                </button>
              </div>
            ) : (
              emails.map((email) => (
                <div
                  key={email.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEmailClick(email.id);
                  }}
                  className="flex items-start gap-3 px-3 sm:px-4 py-3 hover:bg-[#1E1E1E] transition-colors cursor-pointer group"
                >
                  {/* Left Side: Star, Avatar, Status */}
                  <div className="flex items-start gap-2 flex-shrink-0">
                    {/* Star Icon */}
                    <button
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(email.id);
                      }}
                    >
                      <svg
                        className={`w-4 h-4 ${email.isStarred ? 'text-yellow-400 fill-yellow-400 opacity-100' : 'text-gray-500'}`}
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

                    {/* Sender Avatar/Initials - Top Left */}
                    <div className="flex-shrink-0">
                      {(() => {
                        const senderName = email.from.split("<")[0].trim() || email.from;
                        const senderEmail = email.from.match(/<([^>]+)>/)?.[1] || email.from;
                        const initials = senderName
                          .split(' ')
                          .filter(n => n.length > 0)
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2) || senderEmail.charAt(0).toUpperCase();
                        
                        // Generate consistent color based on sender email
                        const colors = [
                          'from-blue-500 to-cyan-500',
                          'from-purple-500 to-pink-500',
                          'from-green-500 to-emerald-500',
                          'from-orange-500 to-red-500',
                          'from-indigo-500 to-blue-500',
                          'from-pink-500 to-rose-500',
                          'from-teal-500 to-cyan-500',
                          'from-yellow-500 to-orange-500',
                        ];
                        const colorIndex = senderEmail.charCodeAt(0) % colors.length;
                        const colorClass = colors[colorIndex];
                        
                        return (
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}>
                            {initials}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Status Indicator - Small badge */}
                    <div className={`${getStatusColor(email.threatLevel)} text-xs flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-2`}>
                      {getStatusIcon(email.threatLevel)}
                    </div>
                  </div>

                  {/* Main Content: Sender, Subject, Body */}
                  <div className="flex-1 min-w-0">
                    {/* Sender Name - Top */}
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-white truncate">
                        {email.from.split("<")[0].trim() || email.from}
                      </p>
                      {/* Threat Flags - Inline with sender */}
                      {email.threatFlags && email.threatFlags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            // Prioritize "Whitelisted sender" if it exists
                            const hasWhitelisted = email.threatFlags.includes('Whitelisted sender');
                            const flagsToShow = hasWhitelisted 
                              ? ['Whitelisted sender', ...email.threatFlags.filter(f => f !== 'Whitelisted sender')].slice(0, 2)
                              : email.threatFlags.slice(0, 2);
                            
                            return flagsToShow.map((tag, index) => (
                              <span
                                key={index}
                                className={`px-1.5 py-0.5 text-xs rounded ${
                                  tag === 'Whitelisted sender' 
                                    ? 'bg-green-900/30 text-green-400 border border-green-800/50' 
                                    : 'bg-red-900/30 text-red-400'
                                }`}
                              >
                                {tag}
                              </span>
                            ));
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Subject - Truncated */}
                    <div className="mb-1">
                      <span className="font-medium text-sm text-white truncate block">
                        {email.subject || "(No subject)"}
                      </span>
                    </div>

                    {/* Email Body Snippet - Truncated */}
                    <div className="mb-1">
                      <span className="text-xs text-gray-400 line-clamp-2">
                        {email.body.replace(/\s+/g, ' ').trim()}
                        {email.body.length > 100 ? '...' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Time & Actions */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTime(email.receivedAt)}
                    </span>
                    <button
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEmail(email.id);
                      }}
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

        {/* Add Email Account Modal */}
        {showAddEmailModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#151515] rounded-2xl p-8 max-w-md w-full mx-4 border border-[#1E1E1E]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Connect Your Email</h2>
                <button
                  onClick={() => setShowAddEmailModal(false)}
                  className="text-white hover:text-white"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <p className="text-white mb-6">
                To get started with 0xMail, please connect your email account for AI-powered
                protection
              </p>

              <div className="space-y-3">
                {/* Gmail */}
                <button
                  onClick={handleGmailConnect}
                  className="w-full p-4 border border-[#1E1E1E] rounded-lg hover:bg-[#1E1E1E] transition-colors flex items-center gap-3"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <div className="text-left">
                    <p className="font-medium">Connect Gmail</p>
                    <p className="text-sm text-white">Use your Google account</p>
                  </div>
                </button>

                {/* Outlook */}
                <button
                  onClick={handleOutlookConnect}
                  className="w-full p-4 border border-[#1E1E1E] rounded-lg hover:bg-[#1E1E1E] transition-colors flex items-center gap-3"
                >
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.268C24 5.596 18.627 0 12 0S0 5.596 0 12.268c0 6.235 4.667 11.426 10.742 12.41V15.96H7.508v-3.692h3.234V9.58c0-3.226 1.931-5.004 4.867-5.004 1.41 0 2.884.25 2.884.25v3.17h-1.625c-1.601 0-2.1.992-2.1 2.01v2.413h3.574l-.571 3.693h-3.003v8.716C19.333 23.694 24 18.502 24 12.268z" />
                  </svg>
                  <div className="text-left">
                    <p className="font-medium">Connect Outlook</p>
                    <p className="text-sm text-white">Use your Microsoft account</p>
                  </div>
                </button>

                {/* Custom Domain */}
                <button
                  onClick={() => {
                    alert("Custom domain configuration coming soon!");
                    setShowAddEmailModal(false);
                  }}
                  className="w-full p-4 border border-[#1E1E1E] rounded-lg hover:bg-[#1E1E1E] transition-colors flex items-center gap-3"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  <div className="text-left">
                    <p className="font-medium">Custom Domain</p>
                    <p className="text-sm text-white">IMAP/SMTP configuration</p>
                  </div>
                </button>
              </div>

              <p className="text-center text-gray-400 text-sm mt-6">
                You can skip this and add it later in{" "}
                <button
                  onClick={() => {
                    setShowAddEmailModal(false);
                    router.push("/settings");
                  }}
                  className="text-white hover:underline"
                >
                  Settings
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
