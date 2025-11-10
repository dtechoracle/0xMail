import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full">
      <div className="bg-[#111111]">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-6 text-center sm:text-left sm:flex-row sm:items-center sm:justify-between">
              <p className="text-white text-sm">
                © {new Date().getFullYear()} 0xMail. All rights reserved.
              </p>
              <div className="flex items-center justify-center sm:justify-end gap-6 text-sm">
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="mailto:support@0xmail.co"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
