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
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
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
          setEmail(prev => prev ? {
            ...prev,
            analysis: {
              ...prev.analysis,
              aiSummary: summary
            }
          } : prev);
        }
      } catch (error) {
        console.error('Failed to generate summary:', error);
        setEmail(prev => prev ? {
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

  async function handleAIGenerate(prompt: string) {
    try {
      setIsGeneratingAI(true);
      const response = await apiClient.generateAIReply({
        prompt: prompt,
        emailBody: email.body,
        emailSubject: email.subject,
        emailFrom: email.from,
      });

      if (response.success) {
        setReplyBody(response.data.reply);
        toast.success("AI reply generated successfully");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate AI reply");
    } finally {
      setIsGeneratingAI(false);
    }
  }

  function handleReplyTextChange(text: string) {
    setReplyBody(text);

    // Check if user typed "#" followed by text
    const aiMatch = text.match(/^#(.+)$/);
    if (aiMatch && aiMatch[1].trim().length > 3) {
      const prompt = aiMatch[1].trim();
      handleAIGenerate(prompt);
    }
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
      
      // Trigger a rescan to update the threat analysis
      await apiClient.rescanEmail(params.id as string);
      
      // Refresh email details
      await fetchEmailDetails();
      
    } catch (error: any) {
      console.error('Mark as safe error:', error);
      toast.error('Failed to mark sender as safe');
    } finally {
      setIsMarkingSafe(false);
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
            onClick={() => {
              console.log('Going back to inbox');
              router.push('/home');
            }}
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
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-sm font-medium ${getStatusColor(email.threatLevel)}`}>
                      {email.threatLevel.charAt(0).toUpperCase() + email.threatLevel.slice(1)}
                    </span>
                    <span className="text-white text-sm">
                      | {new Date(email.receivedAt).toLocaleString()}
                    </span>
                    {email.analysis?.authorizedSender && (
                      <span className="ml-0 sm:ml-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-500/15 text-green-400 border border-green-500/30">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Authorized sender{email.analysis?.authorizedBrand ? `: ${email.analysis.authorizedBrand}` : ''}
                      </span>
                    )}
                  </div>
                  {email.threatFlags && email.threatFlags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {email.threatFlags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className={`px-2 py-1 text-xs rounded ${
                            tag === 'Whitelisted sender' 
                              ? 'bg-green-900/30 text-green-400' 
                              : 'bg-red-900/30 text-red-400'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {/* Only show "Mark as Safe" button if email is not already safe */}
                  {email.threatLevel !== 'safe' && (
                    <button
                      onClick={handleMarkAsSafe}
                      disabled={isMarkingSafe || isWhitelisted}
                      className={`${isWhitelisted 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                      } px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                    >
                      {isMarkingSafe ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Marking...
                        </>
                      ) : isWhitelisted ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Marked as Safe
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Mark as Safe
                        </>
                      )}
                    </button>
                  )}
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

            {/* Message Content with image handling */}
            <div className="bg-[#151515] rounded-xl p-4 sm:p-6 border border-[#1E1E1E]">
              <div className="max-w-none break-words">
                {email.htmlBody ? (
                  <div
                    className="overflow-x-auto email-content"
                    style={{ color: '#ffffff' }}
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
                    className="overflow-x-auto text-white"
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

            {/* Reply Section */}
            <div className="bg-[#151515] rounded-xl border border-[#1E1E1E]">
              {!showReplyBox ? (
                <button
                  onClick={() => setShowReplyBox(true)}
                  className="w-full p-4 flex items-center gap-3 text-white hover:bg-[#1E1E1E] transition-colors rounded-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                  <span>Reply</span>
                </button>
              ) : (
                <div className="p-4 sm:p-6 rounded-xl">
                  {/* Reply Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Reply</h3>
                    <button
                      onClick={() => {
                        setShowReplyBox(false);
                        setReplyBody("");
                        setCc("");
                        setBcc("");
                        setShowCcBcc(false);
                      }}
                      className="text-white hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* To Field */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm w-12">To:</span>
                      <span className="text-white text-sm">{email.from}</span>
                    </div>
                  </div>

                  {/* Cc/Bcc Fields */}
                  {showCcBcc && (
                    <>
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm w-12">Cc:</span>
                          <input
                            type="text"
                            value={cc}
                            onChange={(e) => setCc(e.target.value)}
                            placeholder="Cc recipients"
                            className="flex-1 bg-black border border-[#1E1E1E] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm w-12">Bcc:</span>
                          <input
                            type="text"
                            value={bcc}
                            onChange={(e) => setBcc(e.target.value)}
                            placeholder="Bcc recipients"
                            className="flex-1 bg-black border border-[#1E1E1E] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* AI Helper Prompt */}
                  <div className="mb-4 bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-blue-300 text-sm font-medium mb-2">AI Reply Prompt</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Describe how the AI should reply (e.g., accept the meeting politely)"
                            className="flex-1 bg-black border border-blue-800/50 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 placeholder:text-white/50"
                          />
                          <button
                            onClick={() => aiPrompt.trim() && handleAIGenerate(aiPrompt.trim())}
                            disabled={isGeneratingAI || !aiPrompt.trim()}
                            className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGeneratingAI ? 'Generating...' : 'Generate'}
                          </button>
                        </div>
                        <p className="text-blue-200 text-xs mt-2">
                          Tip: You can also type <span className="font-mono bg-blue-900/40 px-1.5 py-0.5 rounded">#your prompt</span> directly in the reply box.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reply Body */}
                  <div className="mb-4">
                    <textarea
                      value={replyBody}
                      onChange={(e) => handleReplyTextChange(e.target.value)}
                      placeholder="Type your reply or use # to generate with AI..."
                      disabled={isGeneratingAI}
                      className="w-full bg-black border border-[#1E1E1E] rounded-lg px-4 py-3 text-white min-h-[200px] focus:outline-none focus:border-white resize-none disabled:opacity-50"
                    />
                    {isGeneratingAI && (
                      <div className="flex items-center gap-2 mt-2 text-blue-400 text-sm">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating AI reply...</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSendReply}
                        disabled={isSendingReply || isGeneratingAI || !replyBody.trim()}
                        className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingReply ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </span>
                        ) : (
                          "Send"
                        )}
                      </button>
                      {!showCcBcc && (
                        <button
                          onClick={() => setShowCcBcc(true)}
                          className="text-white hover:text-white text-sm px-3 py-2"
                        >
                          Cc/Bcc
                        </button>
                      )}
                    </div>

                    {/* Formatting Options */}
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-white hover:bg-[#1E1E1E] rounded transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </button>
                      <button className="p-2 text-white hover:bg-[#1E1E1E] rounded transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Threat Analysis Sidebar */}
          {showAnalysis && email.analysis && (
            <div className="space-y-6">
              {/* AI Summary */}
              <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                <h2 className="text-lg font-semibold mb-2">AI Summary</h2>
                {email.analysis.aiSummary ? (
                  <p className="text-sm text-white/80 leading-relaxed">
                    {email.analysis.aiSummary}
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
    
    // Force all text to be visible in dark mode (like Gmail)
    doc.querySelectorAll('*').forEach((el: any) => {
      // Skip links - we handle them separately
      if (el.tagName === 'A') return;
      
      const bgColor = el.style.backgroundColor || el.getAttribute('bgcolor');
      const textColor = el.style.color || el.getAttribute('color');
      
      // If element has a light background, make text dark
      if (bgColor && isLightColor(bgColor)) {
        el.style.color = '#000000 !important';
        el.style.setProperty('color', '#000000', 'important');
      } else {
        // For all other elements, force text to be white (dark mode)
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
