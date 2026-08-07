import api from "./api";

// Matches the Express backend's /patients routes.
//   GET    /patients?search=&page=&pageSize=  -> { data, meta }
//   GET    /patients/:id                       -> { data }
//   POST   /patients                           -> { data }
//   PUT    /patients/:id                       -> { data }
//   DELETE /patients/:id                       -> 204

export const getPatients = (params = {}) =>
  api.get("/patients", { params }).then((res) => res.data);

export const getPatient = (id) =>
  api.get(`/patients/${id}`).then((res) => res.data);

export const createPatient = (payload) =>
  api.post("/patients", payload).then((res) => res.data);

export const updatePatient = (id, payload) =>
  api.put(`/patients/${id}`, payload).then((res) => res.data);

export const deletePatient = (id) => api.delete(`/patients/${id}`);
