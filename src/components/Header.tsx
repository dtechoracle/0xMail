import Link from "next/link";

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#151515] backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">0x</span>
              </div>
              <span>0xMail.</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/pricing" 
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Pricing
            </Link>
            <Link 
              href="/features" 
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Features
            </Link>
          </nav>

          <div className="flex items-center">
            <Link
              href="/get-started"
              className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
