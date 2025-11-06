"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ComposePage() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  async function handleGenerate() {
    if (!aiPrompt.trim()) {
      toast.error("Enter a prompt for the AI");
      return;
    }
    try {
      setIsGenerating(true);
      const res = await apiClient.generateAIReply({ prompt: aiPrompt.trim() });
      if (res.success) {
        setBody(res.data.reply);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate draft");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSend() {
    if (!to.trim()) {
      toast.error("Recipient is required");
      return;
    }
    if (!body.trim()) {
      toast.error("Email body is required");
      return;
    }
    try {
      setIsSending(true);
      const res = await apiClient.sendEmail({ to: to.trim(), subject: subject.trim(), body, cc: cc || undefined, bcc: bcc || undefined });
      if (res.success) {
        toast.success("Email sent");
        router.push("/home");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="bg-black min-h-screen text-white p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/home')}
            className="flex items-center gap-2 text-white hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Inbox</span>
          </button>
          <h1 className="text-2xl font-bold">Compose</h1>
        </div>

        <div className="bg-[#151515] rounded-xl p-4 sm:p-6 border border-[#1E1E1E] space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-16 text-sm">To</span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 bg-black border border-[#1E1E1E] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-sm">Cc</span>
            <input
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder=""
              className="flex-1 bg-black border border-[#1E1E1E] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-sm">Bcc</span>
            <input
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder=""
              className="flex-1 bg-black border border-[#1E1E1E] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-sm">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 bg-black border border-[#1E1E1E] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
            />
          </div>

          <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
            <p className="text-blue-300 text-sm font-medium mb-2">AI Draft Prompt</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the email you want to send (tone, content, purpose)"
                className="flex-1 bg-black border border-blue-800/50 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 placeholder:text-white/50"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Your message..."
            className="w-full bg-black border border-[#1E1E1E] rounded-lg px-4 py-3 text-white min-h-[260px] focus:outline-none focus:border-white resize-none"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleSend}
              disabled={isSending || !to.trim() || !body.trim()}
              className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}






