import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
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
      <div className="max-w-4xl mx-auto md:mt-28">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-8 leading-tight">
            Your inbox deserves a{" "}
            <span className="inline-flex items-center mx-2">
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 bg-black rounded-lg flex items-center justify-center mx-2">
                  <img src="/Images/shield.png" alt="Bodyguard" />
                </div>
              </div>
              bodyguard
            </span>
          </h1>

          {/* CTA Buttons */}
          <div className="flex flex-row gap-3 sm:gap-4 justify-center mb-8">
            <Link 
              href="/auth/signup"
              className="bg-white text-black px-4 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-sm sm:text-lg hover:bg-gray-100 transition-colors duration-200"
            >
              Get Started Free
            </Link>
            <Link 
              href="#how-it-works"
              className="border border-gray-400 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-sm sm:text-lg hover:border-gray-300 hover:bg-gray-800/50 transition-colors duration-200"
            >
              See How It Works
            </Link>
          </div>

          {/* Subtitle */}
          <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto mb-12">
            Works with Gmail, Outlook, and custom domains. No setup headache.
          </p>
        </div>
      </div>

      {/* Dashboard Image with Bottom Fade */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mb-20 sm:-mb-32">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
       
          <div className="relative w-full aspect-video bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
            <Image
              src="/Images/dashboard-preview.png"
              alt="0xMail Dashboard Preview"
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Bottom Fade Gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
        </div>
      </div>
    </section>
  );
}
