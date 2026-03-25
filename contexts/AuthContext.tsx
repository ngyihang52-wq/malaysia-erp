"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";

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

  // Validate auth ONCE on mount — server layouts protect routes on every
  // request, so we don't need to re-validate on every client navigation.
  useEffect(() => {
    // Fast path: read user from the non-httpOnly cookie to avoid a flash
    const cookieUser = getCookie("erp_user");
    if (cookieUser) {
      try { setUser(JSON.parse(cookieUser)); } catch { /* ignore */ }
    }

    // Check if we even have a token before hitting the server
    const hasToken = getCookie("erp_token") !== null || document.cookie.includes("erp_token");
    // erp_token is httpOnly so we can't read it from JS, but its presence
    // can be inferred from a successful /api/auth/me response below.
    // Just call /api/auth/me to validate.

    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        // Only treat an explicit 401 as a "logged out" signal.
        // 500s, network errors, etc. should NOT log the user out.
        if (res.status === 401) return { success: false, _status: 401 };
        if (!res.ok) return { success: true, _transient: true }; // keep existing user on errors
        return res.json();
      })
      .then((data) => {
        if (data._transient) {
          // Transient server error — keep the cookie-based user data
          return;
        }
        if (data.success) {
          setUser(data.data);
        } else {
          // Confirmed 401 from server — clear state but don't hard-redirect
          // (the server layout will redirect on next navigation if token is gone)
          setUser(null);
        }
      })
      .catch(() => {
        // Network error — don't log out, keep existing user from cookie
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONCE on mount — server layouts handle per-request protection

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
