import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full">
      {/* Copyright - In gray section */}
      <div className="bg-[#111111]">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <p className="text-white text-sm">
                © 2025 0xMail. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
