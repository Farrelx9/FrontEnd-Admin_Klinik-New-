import api from "./api";

// Matches the Express backend's /medical-records routes.
//   GET    /medical-records?patientId=&page=&pageSize=  -> { data, meta }
//   GET    /medical-records/:id                          -> { data }
//   POST   /medical-records                               -> { data }
//   PUT    /medical-records/:id                            -> { data }
//   DELETE /medical-records/:id                            -> 204

export const getMedicalRecords = (params = {}) =>
  api.get("/medical-records", { params }).then((res) => res.data);

export const getMedicalRecord = (id) =>
  api.get(`/medical-records/${id}`).then((res) => res.data);

export const createMedicalRecord = (payload) =>
  api.post("/medical-records", payload).then((res) => res.data);

export const updateMedicalRecord = (id, payload) =>
  api.put(`/medical-records/${id}`, payload).then((res) => res.data);

export const deleteMedicalRecord = (id) => api.delete(`/medical-records/${id}`);
