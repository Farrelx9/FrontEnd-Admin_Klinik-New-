import api from "./api";

// Matches the Express backend's /invoices routes.
//   GET    /invoices?patientId=&status=       -> { data }
//   GET    /invoices/:id                        -> { data }
//   POST   /invoices                             -> { data }
//   PUT    /invoices/:id                          -> { data }
//   DELETE /invoices/:id                           -> 204
//   POST   /invoices/:id/payments  (add installment) -> { data }
//   DELETE /payments/:id            (remove installment) -> 204
//
// Every response for a single invoice includes computed `paidAmount`
// and `remainingAmount` alongside the stored `status` — the frontend
// never re-derives these, it just displays what the server computed.

export const getInvoices = (params = {}) =>
  api.get("/invoices", { params }).then((res) => res.data);

export const getInvoice = (id) =>
  api.get(`/invoices/${id}`).then((res) => res.data);

export const createInvoice = (payload) =>
  api.post("/invoices", payload).then((res) => res.data);

export const updateInvoice = (id, payload) =>
  api.put(`/invoices/${id}`, payload).then((res) => res.data);

export const deleteInvoice = (id) => api.delete(`/invoices/${id}`);

export const addInvoicePayment = (invoiceId, payload) =>
  api.post(`/invoices/${invoiceId}/payments`, payload).then((res) => res.data);

export const deleteInvoicePayment = (paymentId) => api.delete(`/payments/${paymentId}`);
