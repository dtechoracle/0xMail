import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center">
      {/* Hero Image Background */}
      <div className="absolute inset-0">
        <Image
          src="/Images/mail0x-hero.png"
          alt="0xMail Hero Background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Overlay Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto mt-28">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-8 leading-tight">
            Your inbox deserves a{" "}
            <span className="inline-flex items-center mx-2">
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 bg-black rounded-lg flex items-center justify-center mx-2">
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                  </svg>
                </div>
              </div>
              bodyguard
            </span>
          </h1>

          {/* CTA Buttons */}
          <div className="flex flex-row gap-3 sm:gap-4 justify-center mb-8">
            <button className="bg-white text-black px-4 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-sm sm:text-lg hover:bg-gray-100 transition-colors duration-200">
              Get Started Free
            </button>
            <button className="border border-gray-400 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-sm sm:text-lg hover:border-gray-300 hover:bg-gray-800/50 transition-colors duration-200">
              See How It Works
            </button>
          </div>

          {/* Subtitle */}
          <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto">
            Works with Gmail, Outlook, and custom domains. No setup headache.
          </p>
        </div>
      </div>
    </section>
  );
}
