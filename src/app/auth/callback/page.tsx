"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { checkAuth } = useAuth();

  useEffect(() => {
    if (status === "authenticated" && session) {
      const apiToken = (session.user as any)?.apiToken;
      
      if (apiToken) {
        // Store token in localStorage and apiClient
        localStorage.setItem("token", apiToken);
        apiClient.setToken(apiToken);
        
        // Refresh auth context
        checkAuth().then(() => {
          router.push("/home");
        });
      } else {
        // If no token, redirect to login
        router.push("/auth/login");
      }
    } else if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [session, status, router, checkAuth]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="flex gap-2 justify-center mb-4">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-white">Completing sign in...</p>
      </div>
    </div>
  );
}

