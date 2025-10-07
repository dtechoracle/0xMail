import Link from "next/link";

export default function TaglineSection() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-start">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">0x</span>
              </div>
              <span>0xMail.</span>
            </Link>
          </div>
          
          {/* Tagline and Navigation */}
          <div className="w-full flex items-start justify-between">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white flex-1">
              Shield your inbox with AI precision.
            </h2>
            
            {/* Navigation Links - Right */}
            <nav className="flex flex-col items-end space-y-2 ml-8">
              <Link 
                href="/explore" 
                className="text-white hover:text-gray-300 transition-colors duration-200 text-sm"
              >
                Explore
              </Link>
              <Link 
                href="/pricing" 
                className="text-white hover:text-gray-300 transition-colors duration-200 text-sm"
              >
                Pricing
              </Link>
              <Link 
                href="/features" 
                className="text-white hover:text-gray-300 transition-colors duration-200 text-sm"
              >
                Features
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
