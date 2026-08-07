import api from "./api";

// Matches the Express backend's /services routes (treatment catalog/tariffs).
export const getServices = () => api.get("/services").then((res) => res.data);

export const createService = (payload) =>
  api.post("/services", payload).then((res) => res.data);

export const updateService = (id, payload) =>
  api.put(`/services/${id}`, payload).then((res) => res.data);

export const deleteService = (id) => api.delete(`/services/${id}`);
