import api from "./api";

// Adjust these paths once the Express API routes are finalized.
// Expected shapes (adjust to match your Express implementation):
//   POST /auth/login  { email, password } -> { token, user }
//   GET  /auth/me      (Bearer token)      -> { user }
export const loginRequest = (credentials) =>
  api.post("/auth/login", credentials).then((res) => res.data);

export const fetchCurrentUser = () =>
  api.get("/auth/me").then((res) => res.data);

export const logoutRequest = () =>
  api.post("/auth/logout").catch(() => {
    // Logout is best-effort on the client; even if the server call
    // fails (e.g. token already expired), we still clear local state.
  });
