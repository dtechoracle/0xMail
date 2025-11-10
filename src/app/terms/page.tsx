import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | 0xMail",
  description:
    "Understand the terms and conditions that govern your use of 0xMail.",
};

const sections = [
  {
    title: "Acceptance of Terms",
    body: [
      "By creating an account or using 0xMail you agree to these Terms of Service and any referenced policies. If you do not agree, do not access the platform.",
    ],
  },
  {
    title: "Eligibility & Account Responsibilities",
    body: [
      "You must be at least 18 years old and be able to enter into contracts to use the service.",
      "You are responsible for safeguarding login credentials, enabling two-factor authentication, and notifying us immediately of any unauthorized access.",
      "You must provide accurate information and keep it up to date.",
    ],
  },
  {
    title: "Permitted Use",
    body: [
      "0xMail is designed for legitimate email security, AI summarization, and mailbox automation.",
      "Do not attempt to reverse engineer, probe, or overload the platform, and do not use it to send spam or malicious content.",
      "Compliance with local laws and email provider policies (e.g., Gmail, Outlook) is required at all times.",
    ],
  },
  {
    title: "Mailbox Access & AI Features",
    body: [
      "You authorize 0xMail to access the mailboxes you connect solely to provide scanning, summarization, and sending features.",
      "AI-generated content may be imperfect. You are responsible for reviewing summaries and drafted emails before sending.",
      "We may store message metadata, derived threat scores, and summaries as needed to provide the service.",
    ],
  },
  {
    title: "Payments & Subscription",
    body: [
      "Paid plans are billed in advance. Fees are non-refundable except where required by law.",
      "We may change prices with prior notice. Continued use after a price change constitutes acceptance.",
      "Failure to pay may result in suspension or termination of your account.",
    ],
  },
  {
    title: "Termination",
    body: [
      "You may close your account at any time through the dashboard or by contacting support.",
      "We may suspend or terminate access when necessary to protect the platform, comply with law, or for material breaches of these terms.",
      "Upon termination we will delete or anonymize personal data in accordance with the Privacy Policy.",
    ],
  },
  {
    title: "Disclaimers & Limitation of Liability",
    body: [
      "0xMail is provided on an \"as is\" basis. We do not guarantee uninterrupted or error-free operation, nor the accuracy of AI-generated content.",
      "To the fullest extent permitted by law, 0xMail is not liable for any indirect, incidental, or consequential damages arising from your use of the service.",
    ],
  },
  {
    title: "Indemnification",
    body: [
      "You agree to indemnify and hold 0xMail harmless from any claims arising from your use of the service, your content, or violations of these terms.",
    ],
  },
  {
    title: "Changes to These Terms",
    body: [
      "We may update these terms to reflect new features or legal requirements. We will post updates on this page and update the “Last updated” date. Continued use after changes constitutes acceptance.",
    ],
  },
  {
    title: "Governing Law & Contact",
    body: [
      "These terms are governed by the laws of the State of Delaware, USA, without regard to conflict of law principles.",
      "For questions, contact legal@0xmail.co.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4 mb-12">
            <h1 className="text-4xl font-semibold tracking-tight">
              Terms of Service
            </h1>
            <p className="text-gray-400">
              Last updated: {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-gray-300">
              These Terms of Service outline the rules, responsibilities, and
              limits that apply when you use 0xMail. Please review them
              carefully.
            </p>
          </div>

          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.title} className="space-y-4">
                <h2 className="text-2xl font-semibold text-white">
                  {section.title}
                </h2>
                <div className="space-y-3 text-gray-300 leading-relaxed">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

