import api from "./api";

// GET is open to any authenticated user (e.g. picking a dokter when
// scheduling an appointment). Create/update/delete are enforced
// admin-only server-side regardless of what's called here.
export const getStaff = () => api.get("/staff").then((res) => res.data);

export const createStaff = (payload) =>
  api.post("/staff", payload).then((res) => res.data);

export const updateStaff = (id, payload) =>
  api.put(`/staff/${id}`, payload).then((res) => res.data);

export const deleteStaff = (id) => api.delete(`/staff/${id}`);
