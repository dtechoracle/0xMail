import Image from "next/image";

interface StepProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function Step({ number, title, description, icon }: StepProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      {/* Step Number and Icon */}
      <div className="flex-shrink-0">
        <div className="relative">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-black font-bold text-xl">
            {number}
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            {icon}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1">
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      title: "Connect Your Email",
      description: "Link your Gmail, Outlook, or custom domain in seconds. We use OAuth for secure, read-only access. Your password stays with you—we never see it.",
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      number: "2",
      title: "AI Scans Every Email",
      description: "Our AI analyzes headers, SPF/DKIM records, link patterns, sender reputation, and content in real-time. Every email gets a threat score before it reaches you.",
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      number: "3",
      title: "Get Instant Alerts",
      description: "Suspicious emails are flagged immediately with clear threat levels. Safe emails get AI summaries. You see everything at a glance in your dashboard.",
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      number: "4",
      title: "Stay Protected",
      description: "Whitelist trusted senders, review quarantined emails, and let AI help you compose replies. Your inbox stays clean and secure, automatically.",
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="w-full px-4 sm:px-6 lg:px-8 py-20 sm:py-32 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-gray-400 text-lg sm:text-xl max-w-3xl mx-auto">
            Four simple steps to transform your inbox into a fortress. No technical knowledge required.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12 sm:space-y-16 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <Step
              key={index}
              number={step.number}
              title={step.title}
              description={step.description}
              icon={step.icon}
            />
          ))}
        </div>

        {/* Visual Separator */}
        <div className="mt-20 flex items-center justify-center">
          <div className="h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        </div>
      </div>
    </section>
  );
}

