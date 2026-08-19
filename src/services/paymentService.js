import api from "./api";

// Matches the Express backend's /payments routes.
//   GET    /payments?status=&patientId=  -> { data }
//   GET    /payments/:id                  -> { data }
//   POST   /payments                       -> { data }
//   PUT    /payments/:id                    -> { data }
//   DELETE /payments/:id                    -> 204

export const getPayments = (params = {}) =>
  api.get("/payments", { params }).then((res) => res.data);

export const getPayment = (id) =>
  api.get(`/payments/${id}`).then((res) => res.data);

export const createPayment = (payload) =>
  api.post("/payments", payload).then((res) => res.data);

export const updatePayment = (id, payload) =>
  api.put(`/payments/${id}`, payload).then((res) => res.data);

export const deletePayment = (id) => api.delete(`/payments/${id}`);
