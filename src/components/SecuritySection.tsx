export default function SecuritySection() {
  const securityFeatures = [
    {
      title: "End-to-End Encryption",
      description: "All email data is encrypted in transit and at rest. We use industry-standard TLS/SSL for all connections.",
    },
    {
      title: "No Data Storage",
      description: "Emails are analyzed in real-time and not stored permanently. We only keep metadata necessary for threat detection.",
    },
    {
      title: "OAuth Authentication",
      description: "Secure OAuth 2.0 flow means we never see your passwords. You authenticate directly with your email provider.",
    },
    {
      title: "Regular Security Audits",
      description: "Our infrastructure undergoes regular security audits and penetration testing to ensure your data stays safe.",
    },
   
  ];

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-20 sm:py-32 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Security You Can Trust
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Your privacy is non-negotiable. We've built 0xMail with security and privacy at its core, using industry best practices and zero-trust architecture.
            </p>
            
            <div className="space-y-4">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Call to Action */}
          <div className="flex flex-col items-center lg:items-start justify-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight text-center lg:text-left">
              Smarter and Safer Inbox Starts here.
            </h1>
            <p className="text-gray-400 text-lg sm:text-xl text-center lg:text-left max-w-lg">
              Join thousands of users who trust 0xMail to protect their inbox from threats and keep their communication secure.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

