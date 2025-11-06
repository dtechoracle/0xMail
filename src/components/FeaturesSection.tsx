import Image from "next/image";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-600 hover:border-gray-500 transition-colors duration-200">
      <div className="flex items-start mb-4">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

export default function FeaturesSection() {
  const features = [
    {
      icon: (
        <div className="flex items-center justify-center w-12 h-12">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M12 1v6m0 10v6m11-7h-6m-10 0H1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
        </div>
      ),
      title: "AI-Powered Threat Detection",
      description: "Our models analyze headers, links, and sender patterns to flag phishing attempts in milliseconds."
    },
    {
      icon: (
        <div className="flex items-center justify-center w-12 h-12">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>
        </div>
      ),
      title: "Real-Time Alerts",
      description: "Get instant notifications when a suspicious email hits your inbox, before anyone clicks a bad link."
    },
    {
      icon: (
        <div className="flex items-center justify-center w-12 h-12">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
        </div>
      ),
      title: "Privacy-First Design",
      description: "We scan securely and locally. Your emails stay yours, always encrypted, never shared."
    },
    {
      icon: (
        <div className="flex items-center justify-center w-12 h-12">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
      ),
      title: "Continuous Learning",
      description: "0xMail gets smarter with every threat it catches, adapting to new phishing techniques daily."
    }
    ,
    {
      icon: (
        <div className="flex items-center justify-center w-12 h-12">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3v1H7a2 2 0 00-2 2v3h14v-3a2 2 0 00-2-2h-2v-1c0-1.657-1.343-3-3-3z" />
            </svg>
          </div>
        </div>
      ),
      title: "AI Reply Assistant",
      description: "Compose replies instantly. Type # followed by your prompt to generate a professional response in context."
    }
  ];

  return (
    <section className="w-full px-2 sm:px-6 lg:px-8 py-20 sm:py-32 relative">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden mx-0 sm:mx-8 lg:mx-16">
          <div className="absolute inset-0">
            <Image
              src="/Images/features-bg.png"
              alt="Features Background"
              fill
              className="object-cover"
            />
            <Image
              src="/Images/features-bg-design.png"
              alt="Features Design"
              fill
              className="object-cover object-right"
            />
          </div>
          
          <div className="relative z-10 px-4 sm:px-12 lg:px-16 py-20 sm:py-32">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            Built to stop phishing in its tracks.
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            New: AI Reply Assistant — type <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">#your prompt</span> to generate a polished reply from any email.
          </p>
        </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
