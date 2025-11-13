import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "0xMail - Your Inbox Bodyguard",
  description: "AI-powered email security that stops phishing in its tracks. Works with Gmail, Outlook, and custom domains.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} font-sans antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster 
            position="top-right"
            theme="dark"
            richColors
            closeButton
            duration={5000}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
