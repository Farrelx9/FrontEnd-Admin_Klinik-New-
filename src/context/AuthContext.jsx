import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchCurrentUser, loginRequest, logoutRequest } from "../services/authService";

const AuthContext = createContext(null);

const TOKEN_KEY = "klinik_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "booting" = we're still checking whether an existing token is valid,
  // before we know if the app should show the login page or the app shell.
  const [booting, setBooting] = useState(true);
  const [loginPending, setLoginPending] = useState(false);
  const [error, setError] = useState(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // On first load, if a token exists from a previous session, validate it
  // against the API and restore the user. This is what lets a refresh keep
  // you logged in instead of bouncing to /login every time.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setBooting(false);
      return;
    }

    fetchCurrentUser()
      .then((data) => setUser(data.user ?? data))
      .catch(() => clearSession())
      .finally(() => setBooting(false));
  }, [clearSession]);

  // The axios interceptor fires this when any request comes back 401,
  // e.g. the token expired mid-session. Keep context state in sync.
  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener("klinik:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("klinik:unauthorized", handleUnauthorized);
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    setLoginPending(true);
    setError(null);
    try {
      const data = await loginRequest(credentials);
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user ?? null);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || "Email atau kata sandi salah.";
      setError(message);
      return { success: false, message };
    } finally {
      setLoginPending(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    clearSession();
  }, [clearSession]);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    booting,
    loginPending,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
