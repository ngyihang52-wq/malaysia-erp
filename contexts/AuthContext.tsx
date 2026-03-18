"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  orgId: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Try to read user from cookie first (fast, avoids flash)
    const cookieUser = getCookie("erp_user");
    if (cookieUser) {
      try {
        setUser(JSON.parse(cookieUser));
      } catch { /* ignore parse errors */ }
    }

    // Validate token with server
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data);
        } else {
          setUser(null);
          window.location.href = "http://localhost:5173";
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [pathname, router]);

  const logout = useCallback(() => {
    document.cookie = "erp_user=; Max-Age=0; path=/";
    setUser(null);
    window.location.href = "/api/auth/logout";
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
