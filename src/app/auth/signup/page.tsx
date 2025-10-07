"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

// Matrix loading component
function MatrixLoader() {
  const [text, setText] = useState("");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*";
  
  useEffect(() => {
    const interval = setInterval(() => {
      let result = "";
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setText(result);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  return <span className="font-mono tracking-wider">{text}</span>;
}

export default function SignupPage() {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleGoogleSignup = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoadingGoogle(true);
    // TODO: Implement Google OAuth for signup
    toast.info("Coming Soon - Google OAuth signup is coming soon!");
    setIsLoadingGoogle(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingForm(true);
    
    try {
      const response = await apiClient.signup(
        formData.email,
        formData.password,
        formData.name
      );
      
      if (response.success) {
        toast.success("Account Created! Welcome to 0xMail! Redirecting...");
        
        // Set first login flag for new users
        localStorage.setItem('isFirstLogin', 'true');
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/home';
        }, 1000);
      }
    } catch (error: any) {
      toast.error(error.message || "Signup failed. Please try again with different credentials");
    } finally {
      setIsLoadingForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-16 py-4">
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-[#151515] rounded-2xl p-6 sm:p-8 w-full">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
              Create your 0xMail account
            </h1>

            <button 
              onClick={handleGoogleSignup}
              disabled={isLoadingGoogle}
              className="w-full bg-[#000000] rounded-lg px-4 py-3 flex items-center justify-center gap-3 transition-colors duration-200 mb-6 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-[#1E1E1E]"
            >
              {isLoadingGoogle ? (
                <MatrixLoader />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-white font-medium">Continue with Google</span>
                </>
              )}
            </button>

            {/* OR Divider */}
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative bg-[#151515] px-4">
                <span className="text-gray-400 text-sm">OR</span>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-[#FFFFFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Full name: ex. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-[#FFFFFF0D] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors duration-200"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-[#FFFFFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="Email: ex. you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full bg-[#FFFFFF0D] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors duration-200"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-[#FFFFFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  className="w-full bg-[#FFFFFF0D] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors duration-200"
                />
              </div>

              {/* Password Hint */}
              <p className="text-gray-400 text-sm">
                Use at least 8 characters, including a number or symbol.
              </p>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={isLoadingForm}
                className="w-full bg-gray-300 text-black rounded-lg py-3 font-medium hover:bg-gray-200 transition-colors duration-200 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoadingForm ? <MatrixLoader /> : "Sign Up"}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-gray-400 text-sm mt-6">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-white hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Promotional */}
      <div className="flex-1 relative hidden lg:flex items-center justify-center px-4 sm:px-8 lg:px-16 py-4">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/Images/auth-side.png"
            alt="0xMail Authentication"
            fill
            className="object-cover"
            priority
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 text-center w-full max-w-4xl mx-auto">
          {/* Logo Badge */}
          <div className="inline-flex items-center gap-2 bg-black rounded-lg px-3 py-2 mb-8">
            <span className="text-white text-sm font-bold">Ox.</span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Smarter email security starts here.
          </h2>

          {/* Description */}
          <p className="text-gray-300 text-lg mb-8">
            Join thousands of users keeping their communication safe with AI-powered screening.
          </p>

          {/* Google Button */}
          <button className="w-full bg-[#1E1E1E] rounded-lg px-4 py-3 flex items-center justify-center gap-3 transition-colors duration-200">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-white font-medium">Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
