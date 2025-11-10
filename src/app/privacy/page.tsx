import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | 0xMail",
  description:
    "Learn how 0xMail collects, uses, and protects your data to keep your inbox secure.",
};

const sections = [
  {
    title: "Introduction",
    body: [
      "0xMail protects your inbox by analyzing messages for threats and summarizing important information. This Privacy Policy explains what data we collect, how we use it, and the controls available to you.",
      "If you have questions, contact us at privacy@0xmail.co.",
    ],
  },
  {
    title: "Information We Collect",
    body: [
      "Account data such as your name, email address, and authentication preferences collected during signup.",
      "Email metadata and content required to provide security scanning, AI summaries, and sending functionality. We only access mailboxes you explicitly authorize.",
      "Security diagnostics including IP addresses, device details, and log activity used to prevent fraud and maintain platform integrity.",
    ],
  },
  {
    title: "How We Use Your Information",
    body: [
      "To authenticate you, enable two-factor security, and maintain your account.",
      "To deliver mailbox features including email syncing, AI summaries, threat detection, and outbound messaging.",
      "To improve reliability, monitor abuse, and develop new features through aggregated, anonymized analytics.",
    ],
  },
  {
    title: "Sharing & Disclosure",
    body: [
      "We never sell your data. We only share information with trusted processors that power core services (email delivery, infrastructure, and AI providers).",
      "Access is limited to team members with a business need and governed by least-privilege controls.",
      "We may disclose information when required by law or to protect the rights and safety of our users.",
    ],
  },
  {
    title: "Data Retention & Security",
    body: [
      "We retain account data for as long as your account remains active. You may request deletion at any time by contacting support.",
      "Threat analysis artifacts and AI summaries are stored securely and purged when no longer required for the service.",
      "All data is encrypted in transit and at rest. We regularly review access controls, audit logs, and third-party security posture.",
    ],
  },
  {
    title: "Your Rights & Choices",
    body: [
      "You may access, update, or delete your account information through the dashboard or by contacting support.",
      "You can revoke mailbox access at any time through Gmail, Outlook, or other provider settings.",
      "Disable analytics cookies or tracking pixels where applicable through browser-level controls.",
    ],
  },
  {
    title: "Updates",
    body: [
      "We will post any privacy policy updates on this page and update the “Last updated” date. Material changes may also be communicated via email.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4 mb-12">
            <h1 className="text-4xl font-semibold tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-gray-400">
              Last updated: {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-gray-300">
              We built 0xMail to secure modern inboxes. This notice explains the
              personal information we collect, why we collect it, and what you
              can do to stay in control.
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

