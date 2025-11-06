import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              How 0xMail Works
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              AI-powered email security that stops phishing in its tracks. Here's how we protect your inbox.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Feature 1 */}
            <div className="bg-[#151515] rounded-xl p-8 border border-[#1E1E1E]">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Real-time Threat Detection</h3>
              <p className="text-gray-300">
                Advanced AI analyzes every email as it arrives, checking for phishing attempts, malicious links, and suspicious content.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#151515] rounded-xl p-8 border border-[#1E1E1E]">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">AI Reply Assistant</h3>
              <p className="text-gray-300">
                Generate professional email replies instantly. Type # followed by your prompt to get contextual, polished responses.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#151515] rounded-xl p-8 border border-[#1E1E1E]">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart Quarantine</h3>
              <p className="text-gray-300">
                Suspicious emails are automatically quarantined while you review them, keeping your inbox clean and secure.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#151515] rounded-xl p-8 border border-[#1E1E1E]">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Authorized Senders</h3>
              <p className="text-gray-300">
                Recognizes trusted brands and reduces false positives for legitimate emails from companies you know.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#151515] rounded-xl p-8 border border-[#1E1E1E]">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Multi-Provider Support</h3>
              <p className="text-gray-300">
                Works seamlessly with Gmail, Outlook, and custom domains. One platform, all your email accounts.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#151515] rounded-xl p-8 border border-[#1E1E1E]">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Detailed Analytics</h3>
              <p className="text-gray-300">
                Get insights into email threats, security trends, and protection statistics to understand your email landscape.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust 0xMail to protect their inbox from phishing and malicious emails.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/auth/signup"
                className="bg-white text-black px-8 py-4 rounded-lg font-medium text-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Start Free Trial
              </a>
              <a 
                href="/auth/login"
                className="border border-gray-400 text-white px-8 py-4 rounded-lg font-medium text-lg hover:border-gray-300 hover:bg-gray-800/50 transition-colors duration-200"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
