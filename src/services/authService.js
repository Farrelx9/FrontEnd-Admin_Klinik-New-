import api from "./api";

export const loginRequest = (credentials) =>
  api.post("/auth/login", credentials).then((res) => res.data);

export const fetchCurrentUser = () =>
  api.get("/auth/me").then((res) => res.data);

export const logoutRequest = () => api.post("/auth/logout").catch(() => {});

// PUT /auth/me — self-service profile update (name, and optionally
// password via currentPassword + newPassword).
export const updateProfileRequest = (payload) =>
  api.put("/auth/me", payload).then((res) => res.data);
