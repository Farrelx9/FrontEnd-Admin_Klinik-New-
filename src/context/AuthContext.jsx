import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchCurrentUser, loginRequest, logoutRequest } from "../services/authService";

const AuthContext = createContext(null);
const TOKEN_KEY = "klinik_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [loginPending, setLoginPending] = useState(false);
  const [error, setError] = useState(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

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
      const message = err.response?.data?.message || "Email atau kata sandi salah.";
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

  // Lets a page (e.g. Pengaturan) push a freshly-saved profile into
  // context after a successful update, so the topbar/sidebar reflect the
  // new name immediately without requiring a full re-login.
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    booting,
    loginPending,
    error,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
