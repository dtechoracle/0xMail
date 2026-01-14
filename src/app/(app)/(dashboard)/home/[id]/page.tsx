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
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState("");
  const [isMarkingSafe, setIsMarkingSafe] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);

  useEffect(() => {
    fetchEmailDetails();
  }, [params.id]);

  // Generate AI summary immediately when email loads
  useEffect(() => {
    const generateSummary = async () => {
      if (!email || email.analysis?.aiSummary || !email.body) {
        return;
      }

      try {
        console.log('Generating AI summary from email body...');
        
        const response = await apiClient.generateAIReply({
          prompt: 'Summarize this email in 1-2 sentences',
          emailBody: email.body,
          emailSubject: email.subject,
          emailFrom: email.from
        });

        if (response.success) {
          const summary = response.data.reply;
          console.log('Generated summary:', summary);
          
          // Update the email state with the summary
          setEmail((prev: any) => prev ? {
            ...prev,
            analysis: {
              ...prev.analysis,
              aiSummary: summary
            }
          } : prev);
        }
      } catch (error) {
        console.error('Failed to generate summary:', error);
        setEmail((prev: any) => prev ? {
          ...prev,
          analysis: {
            ...prev.analysis,
            aiSummary: 'Unable to generate summary at this time.'
          }
        } : prev);
      }
    };

    generateSummary();
  }, [email]);

  async function fetchEmailDetails() {
    try {
      setLoading(true);
      const response = await apiClient.getEmail(params.id as string);

      if (response.success) {
        setEmail(response.data.email);
        
        // Check if sender is whitelisted
        checkIfWhitelisted(response.data.email.from);

        // If AI summary is missing and email is recent (less than 5 minutes old), trigger a rescan
        if (!response.data.email?.analysis?.aiSummary) {
          const emailAge = Date.now() - new Date(response.data.email.receivedAt).getTime();
          const fiveMinutes = 5 * 60 * 1000;
          
          if (emailAge < fiveMinutes) {
            console.log('Recent email missing AI summary, triggering rescan...');
            try {
              await apiClient.rescanEmail(params.id as string);
              console.log('Rescan completed, fetching updated email...');
              const refreshed = await apiClient.getEmail(params.id as string);
              if (refreshed.success) {
                console.log('Updated email data:', refreshed.data.email);
                setEmail(refreshed.data.email);
                checkIfWhitelisted(refreshed.data.email.from);
              }
            } catch (e) {
              console.error('Rescan error:', e);
              // ignore rescan errors; page still shows
            }
          }
        }
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

  async function handleSendReply() {
    if (!replyBody.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    try {
      setIsSendingReply(true);
      await apiClient.replyToEmail(params.id as string, {
        body: replyBody,
        cc: cc || undefined,
        bcc: bcc || undefined,
      });
      toast.success("Reply sent successfully");
      setReplyBody("");
      setCc("");
      setBcc("");
      setShowReplyBox(false);
      setShowCcBcc(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  }

  function handleReplyTextChange(text: string) {
    setReplyBody(text);
  }

  function handleLinkClick(e: React.MouseEvent, url: string) {
    e.preventDefault();
    setSelectedLink(url);
    setShowLinkModal(true);
  }

  function handleConfirmLink() {
    window.open(selectedLink, '_blank', 'noopener,noreferrer');
    setShowLinkModal(false);
    setSelectedLink("");
  }

  function handleCancelLink() {
    setShowLinkModal(false);
    setSelectedLink("");
  }

  async function checkIfWhitelisted(from: string) {
    try {
      const senderMatch = from.match(/<([^>]+)>/);
      const senderEmail = senderMatch ? senderMatch[1] : from;
      const senderDomain = senderEmail.split('@')[1];
      
      const whitelistResponse = await apiClient.getWhitelist();
      if (whitelistResponse.success) {
        const isWhitelisted = whitelistResponse.data.whitelist.some((entry: any) => 
          entry.email === senderEmail || entry.domain === senderDomain
        );
        setIsWhitelisted(isWhitelisted);
      }
    } catch (error) {
      console.error('Check whitelist error:', error);
    }
  }

  async function handleMarkAsSafe() {
    if (!email) return;
    
    try {
      setIsMarkingSafe(true);
      
      // Extract sender email and domain
      const senderMatch = email.from.match(/<([^>]+)>/);
      const senderEmail = senderMatch ? senderMatch[1] : email.from;
      const senderDomain = senderEmail.split('@')[1];
      
      await apiClient.addToWhitelist({
        email: senderEmail,
        domain: senderDomain,
        reason: 'Marked as safe by user'
      });
      
      setIsWhitelisted(true);
      toast.success('Sender marked as safe');
      
      // Update email state immediately to show whitelisted status
      setEmail((prev: any) => prev ? {
        ...prev,
        threatLevel: 'safe',
        threatFlags: [
          ...(prev.threatFlags || []).filter((flag: string) => flag !== 'Whitelisted sender'),
          'Whitelisted sender'
        ]
      } : prev);
      
      // Trigger a rescan to update the threat analysis (async, don't wait)
      apiClient.rescanEmail(params.id as string).then(() => {
        // Refresh email details after rescan completes
        fetchEmailDetails();
      }).catch((error) => {
        console.error('Rescan error after marking safe:', error);
        // Still refresh to get updated data
        fetchEmailDetails();
      });
      
    } catch (error: any) {
      console.error('Mark as safe error:', error);
      toast.error('Failed to mark sender as safe');
    } finally {
      setIsMarkingSafe(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-black min-h-screen text-white">
        <div className="max-w-6xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#1E1E1E] bg-[#151515]">
            <div className="h-6 w-20 bg-[#1E1E1E] rounded animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-[#1E1E1E] rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-[#1E1E1E] rounded animate-pulse"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="flex gap-4 pt-3">
            <div className="flex-1 lg:max-w-3xl space-y-4">
              {/* Subject Skeleton */}
              <div className="px-4 py-3 border-b border-[#1E1E1E]">
                <div className="h-6 w-3/4 bg-[#1E1E1E] rounded animate-pulse mb-2"></div>
                <div className="h-4 w-48 bg-[#1E1E1E] rounded animate-pulse"></div>
              </div>

              {/* Sender Skeleton */}
              <div className="px-4 py-3 border-b border-[#1E1E1E]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#1E1E1E] rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-[#1E1E1E] rounded animate-pulse"></div>
                    <div className="h-3 w-32 bg-[#1E1E1E] rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="px-4 py-4">
                <div className="space-y-2">
                  <div className="h-4 w-full bg-[#1E1E1E] rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-[#1E1E1E] rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-[#1E1E1E] rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-[#1E1E1E] rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-[#1E1E1E] rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="hidden lg:block w-64 flex-shrink-0 space-y-4 pt-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#151515] rounded-lg p-4 border border-[#1E1E1E]">
                  <div className="h-4 w-24 bg-[#1E1E1E] rounded animate-pulse mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-[#1E1E1E] rounded animate-pulse"></div>
                    <div className="h-3 w-3/4 bg-[#1E1E1E] rounded animate-pulse"></div>
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

  // Sender/domain trust score derived from threat score, level and flags
  const getTrustScore = (emailObj: any): { score: number; label: string; description: string; color: string } => {
    const rawThreat = typeof emailObj.threatScore === "number" ? emailObj.threatScore : 0;
    let score = Math.max(0, Math.min(100, 100 - rawThreat));

    if (emailObj.threatLevel === "malicious") {
      score = Math.min(score, 25);
    } else if (emailObj.threatLevel === "suspicious") {
      score = Math.min(score, 60);
    }

    const hasWhitelistFlag = emailObj.threatFlags?.includes("Whitelisted sender");
    if (hasWhitelistFlag || isWhitelisted) {
      score = Math.max(score, 95);
    }

    const rounded = Math.round(score);

    if (rounded >= 80) {
      return {
        score: rounded,
        label: "High trust",
        description: "We have a strong level of confidence in this sender based on current analysis.",
        color: "bg-green-500/10 text-green-300 border border-green-700/60"
      };
    }
    if (rounded >= 50) {
      return {
        score: rounded,
        label: "Medium trust",
        description: "Some signals look safe, but there are risk factors you should be aware of.",
        color: "bg-yellow-500/10 text-yellow-300 border border-yellow-700/60"
      };
    }
    return {
      score: rounded,
      label: "Low trust",
      description: "Multiple risk indicators detected. Treat this sender with extra caution.",
      color: "bg-red-500/10 text-red-300 border border-red-700/60"
    };
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header - Gmail Style Compact */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#1E1E1E] bg-[#151515]">
          <button
            onClick={() => router.push('/home')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            {email.threatLevel !== 'safe' && (
              <button
                onClick={handleMarkAsSafe}
                disabled={isMarkingSafe || isWhitelisted}
                className={`${isWhitelisted 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'text-green-400 hover:text-green-300'
                } px-2 py-1 text-xs transition-colors disabled:opacity-50`}
              >
                {isMarkingSafe ? 'Marking...' : isWhitelisted ? 'Safe' : 'Mark Safe'}
              </button>
            )}
            <button onClick={handleStar} className="p-1.5 hover:bg-[#1E1E1E] rounded transition-colors">
              <svg
                className={`w-4 h-4 ${email.isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`}
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
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              {showAnalysis ? "Hide" : "Show"} Analysis
            </button>
          </div>
        </div>

        <div className={`flex flex-col gap-4 lg:flex-row`}>
          {/* Email Content - Gmail Style */}
          <div className={`flex-1 ${showAnalysis ? "lg:max-w-3xl" : ""}`}>
            {/* Subject - Gmail Style */}
            <div className="px-4 py-3 border-b border-[#1E1E1E]">
              <h1 className="text-xl font-normal text-white mb-2">{email.subject || "(No subject)"}</h1>
              <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400">
                <span className={`${getStatusColor(email.threatLevel)}`}>
                  {getStatusIcon(email.threatLevel)} {email.threatLevel.charAt(0).toUpperCase() + email.threatLevel.slice(1)}
                </span>
                <span>•</span>
                <span>{new Date(email.receivedAt).toLocaleString()}</span>
                {email.analysis?.authorizedSender && (
                  <>
                    <span>•</span>
                    <span className="text-green-400">Verified sender</span>
                  </>
                )}
              </div>
            </div>

            {/* Sender Info - Gmail Style Compact */}
            <div className="px-4 py-3 border-b border-[#1E1E1E]">
              <div className="flex items-start gap-3">
                {(() => {
                  const senderName = email.from.split("<")[0].trim() || email.from;
                  const senderEmail = email.from.match(/<([^>]+)>/)?.[1] || email.from;
                  const initials = senderName
                    .split(' ')
                    .filter((n: string) => n.length > 0)
                    .map((n: string) => n[0])
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-medium text-sm text-white">
                      {email.from.split("<")[0].trim() || email.from}
                    </p>
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      &lt;{email.from.match(/<([^>]+)>/)?.[1] || email.from}&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400">
                      to me
                    </span>
                    {email.threatFlags && email.threatFlags.length > 0 && (
                      <>
                        <span className="text-xs text-gray-500">•</span>
                        <div className="flex flex-wrap gap-1">
                          {email.threatFlags.slice(0, 2).map((tag: string, index: number) => (
                            <span
                              key={index}
                              className={`px-1.5 py-0.5 text-xs rounded ${
                                tag === 'Whitelisted sender' 
                                  ? 'bg-green-900/30 text-green-400' 
                                  : 'bg-red-900/30 text-red-400'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Message Content - Gmail Style */}
            <div className="px-4 py-4">
              <div className="max-w-none break-words text-sm text-white leading-relaxed">
                {email.htmlBody ? (
                  <div
                    className="overflow-x-auto email-content bg-black"
                    style={{ 
                      color: '#ffffff',
                      backgroundColor: '#000000',
                      minHeight: '100px'
                    }}
                    dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(email.htmlBody) }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.tagName === 'A') {
                        e.preventDefault();
                        const link = target as HTMLAnchorElement;
                        handleLinkClick(e, link.href);
                      }
                    }}
                  />
                ) : (
                  <div 
                    className="overflow-x-auto text-white whitespace-pre-wrap bg-black"
                    style={{ backgroundColor: '#000000' }}
                    dangerouslySetInnerHTML={{ __html: linkifyText(email.body) }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.tagName === 'A') {
                        e.preventDefault();
                        const link = target as HTMLAnchorElement;
                        handleLinkClick(e, link.href);
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Reply Section - Gmail Style */}
            <div className="px-4 py-4 border-t border-[#1E1E1E] mt-4">
              {!showReplyBox ? (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowReplyBox(true)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-[#1E1E1E]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                      />
                    </svg>
                    <span>Reply</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-[#1E1E1E]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  {/* Reply Header - Gmail Style */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">To:</span>
                      <span className="text-white">{email.from}</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowReplyBox(false);
                        setReplyBody("");
                        setCc("");
                        setBcc("");
                        setShowCcBcc(false);
                      }}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Cc/Bcc Fields - Gmail Style */}
                  {showCcBcc && (
                    <>
                      <div className="mb-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400 w-8">Cc:</span>
                          <input
                            type="text"
                            value={cc}
                            onChange={(e) => setCc(e.target.value)}
                            placeholder="Cc recipients"
                            className="flex-1 bg-transparent border-b border-[#1E1E1E] px-1 py-1 text-white text-sm focus:outline-none focus:border-white"
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400 w-8">Bcc:</span>
                          <input
                            type="text"
                            value={bcc}
                            onChange={(e) => setBcc(e.target.value)}
                            placeholder="Bcc recipients"
                            className="flex-1 bg-transparent border-b border-[#1E1E1E] px-1 py-1 text-white text-sm focus:outline-none focus:border-white"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Reply Body - Gmail Style */}
                  <div className="mb-3">
                    <textarea
                      value={replyBody}
                      onChange={(e) => handleReplyTextChange(e.target.value)}
                      placeholder="Type your reply..."
                      className="w-full bg-transparent border border-[#1E1E1E] rounded px-3 py-2 text-white text-sm min-h-[120px] focus:outline-none focus:border-white resize-none"
                    />
                  </div>

                  {/* Action Buttons - Gmail Style */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSendReply}
                        disabled={isSendingReply || !replyBody.trim()}
                        className="bg-white text-black px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingReply ? (
                          <span className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            Sending...
                          </span>
                        ) : (
                          "Send"
                        )}
                      </button>
                      {!showCcBcc && (
                        <button
                          onClick={() => setShowCcBcc(true)}
                          className="text-gray-400 hover:text-white text-xs px-2 py-1"
                        >
                          Cc/Bcc
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Threat Analysis Sidebar - Gmail Style Compact */}
          {showAnalysis && email.analysis && (
            <div className="w-full lg:w-64 flex-shrink-0 space-y-4 pt-4 lg:pt-3 mt-4 lg:mt-0">
              {/* Sender Trust & Risk Timeline */}
              {(() => {
                const { score, label, description, color } = getTrustScore(email);
                const receivedAt = new Date(email.receivedAt);
                const firstSeen = receivedAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const threatLabel = threatLevel.level;
                const whitelisted = email.threatFlags?.includes("Whitelisted sender") || isWhitelisted;

                return (
                  <div className="bg-[#151515] rounded-lg p-4 border border-[#1E1E1E]">
                    <h2 className="text-sm font-semibold mb-3">Sender Trust</h2>
                    <div className={`rounded-lg px-4 py-3 mb-3 flex items-center justify-between ${color}`}>
                      <div>
                        <p className="text-xs uppercase tracking-wide opacity-80">Trust score</p>
                        <p className="text-sm font-semibold">{label}</p>
                      </div>
                      <p className="text-2xl font-bold">{score}</p>
                    </div>
                    <p className="text-xs text-white/70 mb-3 leading-relaxed">
                      {description}
                    </p>
                    <div className="space-y-2 mt-2">
                      <p className="text-xs font-semibold text-white/80">Risk timeline</p>
                      <div className="space-y-2 text-xs text-white/70">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-white/60" />
                          <div>
                            <p className="font-medium">First seen</p>
                            <p className="text-white/60">{firstSeen}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-white/60" />
                          <div>
                            <p className="font-medium">This email scanned</p>
                            <p className="text-white/60">
                              {threatLabel} risk • threat score {email.threatScore}/100
                            </p>
                          </div>
                        </div>
                        {whitelisted && (
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-green-400" />
                            <div>
                              <p className="font-medium">Whitelisted by you</p>
                              <p className="text-white/60">
                                Future emails from this sender will be treated as trusted unless new risks appear.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* AI Summary */}
              <div className="bg-[#151515] rounded-lg p-4 border border-[#1E1E1E]">
                <h2 className="text-sm font-semibold mb-2">AI Summary</h2>
                {email.analysis.aiSummary ? (
                  <p className="text-sm text-white/80 leading-relaxed">
                    {email.analysis.aiSummary}
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <p className="text-sm text-white/60">Generating AI summary...</p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          console.log('Manual retry for AI summary...');
                          await apiClient.rescanEmail(params.id as string);
                          setTimeout(async () => {
                            const response = await apiClient.getEmail(params.id as string);
                            if (response.success) {
                              setEmail(response.data.email);
                            }
                          }, 2000);
                        } catch (error) {
                          console.error('Manual retry failed:', error);
                        }
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      Click to retry
                    </button>
                  </div>
                )}
              </div>
              {/* Threat Score */}
              <div className="bg-[#151515] rounded-lg p-4 border border-[#1E1E1E]">
                <h2 className="text-sm font-semibold mb-3">Threat Assessment</h2>
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
              <div className="bg-[#151515] rounded-lg p-4 border border-[#1E1E1E]">
                <h2 className="text-sm font-semibold mb-3">Email Authentication</h2>
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
                <div className="bg-[#151515] rounded-lg p-4 border border-[#1E1E1E]">
                  <h2 className="text-sm font-semibold mb-3">Link Analysis</h2>
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
                <div className="bg-[#151515] rounded-lg p-4 border border-[#1E1E1E]">
                  <h2 className="text-sm font-semibold mb-3">AI Analysis Flags</h2>
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
                <div className="bg-[#151515] rounded-lg p-4 border border-[#1E1E1E]">
                  <h2 className="text-sm font-semibold mb-3">AI Analysis</h2>
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
              <div className="bg-[#151515] rounded-lg p-4 border border-[#1E1E1E]">
                <h2 className="text-sm font-semibold mb-3">Actions</h2>
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

      {/* Link Confirmation Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] rounded-xl p-6 max-w-md w-full border border-[#333]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">External Link Warning</h3>
            </div>
            
            <p className="text-gray-300 mb-4">
              You are about to visit an external website. This link was found in the email content.
            </p>
            
            <div className="bg-[#151515] rounded-lg p-3 mb-4 border border-[#333]">
              <p className="text-sm text-gray-400 mb-1">Destination URL:</p>
              <p className="text-blue-400 text-sm break-all">{selectedLink}</p>
            </div>
            
            <p className="text-yellow-400 text-sm mb-6">
              ⚠️ Only proceed if you trust this source. Malicious links can steal your information.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelLink}
                className="flex-1 bg-[#333] hover:bg-[#444] text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLink}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Continue to Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Convert plain text URLs to clickable links
function linkifyText(text: string): string {
  if (!text) return '';
  
  // Escape HTML special characters first
  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  const escapedText = escapeHtml(text);
  
  // URL regex pattern
  const urlPattern = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  
  // Replace URLs with clickable links
  const linkedText = escapedText.replace(urlPattern, (url) => {
    return `<a href="${url}" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">${url}</a>`;
  });
  
  // Preserve line breaks
  return linkedText.replace(/\n/g, '<br>');
}

// Sanitize email HTML and ensure text is visible in dark mode (like Gmail)
function sanitizeEmailHtml(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    // Remove dangerous elements
    doc.querySelectorAll('script, iframe, object, embed').forEach((el) => el.remove());
    
    // Helper function to check if a color is light
    const isLightColor = (color: string): boolean => {
      if (!color || color === 'transparent' || color === 'inherit' || color === 'initial') return false;
      
      // Handle common light color names
      const lightColors = ['white', 'whitesmoke', 'snow', 'ivory', 'beige', 'linen', 'cornsilk', 'floralwhite', 'ghostwhite', 'honeydew', 'azure', 'aliceblue', 'lavender', 'mintcream', 'seashell', 'oldlace'];
      if (lightColors.includes(color.toLowerCase())) return true;
      
      // Handle hex colors
      if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        if (hex.length === 6) {
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          return luminance > 0.7;
        }
      }
      
      // Handle rgb/rgba colors
      const rgb = color.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const [r, g, b] = rgb.map(Number);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.7;
      }
      
      return false;
    };
    
    // Force body and main containers to have dark background first
    if (doc.body) {
      doc.body.style.backgroundColor = '#000000';
      doc.body.style.color = '#ffffff';
    }
    
    // Force all text to be visible in dark mode (like Gmail)
    doc.querySelectorAll('*').forEach((el: any) => {
      // Skip links - we handle them separately
      if (el.tagName === 'A') return;
      
      const bgColor = el.style.backgroundColor || el.getAttribute('bgcolor');
      const computedStyle = typeof window !== 'undefined' ? window.getComputedStyle(el) : null;
      const computedBgColor = computedStyle ? computedStyle.backgroundColor : null;
      const finalBgColor = bgColor || computedBgColor;
      
      // If element has a light background, make background dark and text light
      if (finalBgColor && isLightColor(finalBgColor)) {
        el.style.backgroundColor = '#1a1a1a !important';
        el.style.setProperty('background-color', '#1a1a1a', 'important');
        el.style.color = '#ffffff !important';
        el.style.setProperty('color', '#ffffff', 'important');
      } else {
        // For all other elements, ensure text is white
        // Only set transparent background if it's explicitly set
        if (finalBgColor && (finalBgColor === 'transparent' || finalBgColor === 'rgba(0, 0, 0, 0)')) {
          el.style.backgroundColor = 'transparent';
        }
        el.style.color = '#ffffff !important';
        el.style.setProperty('color', '#ffffff', 'important');
      }
    });
    
    // Handle table cells and other elements that might have white backgrounds
    doc.querySelectorAll('td, th, div, p, span, table, section, article').forEach((el: any) => {
      const bgColor = el.style.backgroundColor || el.getAttribute('bgcolor');
      const computedStyle = typeof window !== 'undefined' ? window.getComputedStyle(el) : null;
      const computedBgColor = computedStyle ? computedStyle.backgroundColor : null;
      const finalBgColor = bgColor || computedBgColor;
      
      if (finalBgColor && isLightColor(finalBgColor)) {
        el.style.backgroundColor = '#1a1a1a !important';
        el.style.setProperty('background-color', '#1a1a1a', 'important');
        el.style.color = '#ffffff !important';
        el.style.setProperty('color', '#ffffff', 'important');
      }
    });
    
    // Style images
    doc.querySelectorAll('img').forEach((img: any) => {
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.borderRadius = '0.5rem';
    });
    
    // Handle tables and code blocks
    doc.querySelectorAll('table, pre, code').forEach((el: any) => {
      el.style.maxWidth = '100%';
      el.style.overflowX = 'auto';
      el.style.display = 'block';
    });
    
    // Style links to be visible and clickable
    doc.querySelectorAll('a').forEach((link: any) => {
      link.style.color = '#3b82f6 !important';
      link.style.textDecoration = 'underline';
      link.style.cursor = 'pointer';
      link.style.setProperty('color', '#3b82f6', 'important');
    });
    
    return doc.body.innerHTML || '';
  } catch {
    return html;
  }
}
