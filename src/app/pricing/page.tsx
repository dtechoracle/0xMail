import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Choose the plan that fits your needs. All plans include our core email security features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-[#151515] rounded-xl p-8 border border-[#1E1E1E]">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="text-4xl font-bold mb-2">$0</div>
                <p className="text-gray-400">Perfect for individuals</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Up to 100 emails/month</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Basic threat detection</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Gmail & Outlook support</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Email quarantine</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Basic analytics</span>
                </li>
              </ul>
              <Link 
                href="/auth/signup"
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 text-center block"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-[#151515] rounded-xl p-8 border-2 border-white relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-white text-black px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="text-4xl font-bold mb-2">$9</div>
                <p className="text-gray-400">per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Unlimited emails</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Advanced AI detection</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI Reply Assistant</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Custom domains</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Priority support</span>
                </li>
              </ul>
              <Link 
                href="/auth/signup"
                className="w-full bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 text-center block"
              >
                Start Pro Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-[#151515] rounded-xl p-8 border border-[#1E1E1E]">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <div className="text-4xl font-bold mb-2">Custom</div>
                <p className="text-gray-400">For large organizations</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Team management</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>SLA guarantees</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>On-premise options</span>
                </li>
              </ul>
              <Link 
                href="/contact"
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 text-center block"
              >
                Contact Sales
              </Link>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-24">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                <h3 className="text-xl font-semibold mb-3">Is there a free trial?</h3>
                <p className="text-gray-300">Yes! Our Pro plan comes with a 14-day free trial. No credit card required.</p>
              </div>
              <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                <h3 className="text-xl font-semibold mb-3">Can I change plans anytime?</h3>
                <p className="text-gray-300">Absolutely. You can upgrade or downgrade your plan at any time from your account settings.</p>
              </div>
              <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                <h3 className="text-xl font-semibold mb-3">What email providers do you support?</h3>
                <p className="text-gray-300">We support Gmail, Outlook, and custom IMAP/SMTP domains. More providers coming soon.</p>
              </div>
              <div className="bg-[#151515] rounded-xl p-6 border border-[#1E1E1E]">
                <h3 className="text-xl font-semibold mb-3">How does the AI detection work?</h3>
                <p className="text-gray-300">Our AI analyzes email content, links, sender reputation, and behavioral patterns to identify threats in real-time.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
