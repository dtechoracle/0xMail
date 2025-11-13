"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiClient } from "@/lib/api-client";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
  twoFactorEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    try {
      // Check if token exists in localStorage
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Ensure apiClient has the token loaded
        apiClient.setToken(token);

        // Verify token with backend
        const response = await apiClient.getCurrentUser();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
        } else {
          // Token is invalid, clear it
          apiClient.clearToken();
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      // Token is invalid or expired
      apiClient.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    router.push("/auth/login");
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Protect dashboard routes
  useEffect(() => {
    if (!loading) {
      const isAuthRoute = pathname?.startsWith("/auth");
      const isDashboardRoute = pathname?.startsWith("/home") || 
                               pathname?.startsWith("/starred") || 
                               pathname?.startsWith("/quarantine") ||
                               pathname?.startsWith("/compose");

      // Only redirect if we're sure about auth state
      if (isDashboardRoute && !user && !isAuthRoute) {
        // User is not authenticated and trying to access dashboard
        router.push("/auth/login");
      } else if (
        isAuthRoute && 
        user && 
        pathname !== "/auth/setup-2fa" &&
        pathname !== "/auth/verify-email" &&
        pathname !== "/auth/verify-2fa"
      ) {
        // User is authenticated and trying to access auth pages (except setup/verification pages)
        router.push("/home");
      }
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        checkAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

