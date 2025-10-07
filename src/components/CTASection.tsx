export default function CTASection() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#111111] rounded-2xl p-8 sm:p-12 lg:p-16 text-center">
          {/* Main CTA */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to protect your inbox?
          </h2>
          
          <p className="text-gray-300 text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of users keeping their communication safe with AI-powered screening.
          </p>

          {/* CTA Button */}
          <div className="mb-8">
            <button className="bg-white text-black px-8 py-4 rounded-lg font-medium text-lg hover:bg-gray-100 transition-colors duration-200 inline-flex items-center gap-2">
              Start Free Trial
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-gray-400 text-sm sm:text-base">
            No credit card needed • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
