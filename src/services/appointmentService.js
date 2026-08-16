import api from "./api";

// Matches the Express backend's /appointments routes.
//   GET    /appointments?date=YYYY-MM-DD&status=  -> { data }
//   GET    /appointments/:id                        -> { data }
//   POST   /appointments                             -> { data }
//   PUT    /appointments/:id                          -> { data }
//   DELETE /appointments/:id                          -> 204

export const getAppointments = (params = {}) =>
  api.get("/appointments", { params }).then((res) => res.data);

export const getAppointment = (id) =>
  api.get(`/appointments/${id}`).then((res) => res.data);

export const createAppointment = (payload) =>
  api.post("/appointments", payload).then((res) => res.data);

export const updateAppointment = (id, payload) =>
  api.put(`/appointments/${id}`, payload).then((res) => res.data);

export const deleteAppointment = (id) => api.delete(`/appointments/${id}`);
