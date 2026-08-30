import api from "./api";

export const getPatients = (params = {}) =>
  api.get("/patients", { params }).then((res) => res.data);

export const getPatient = (id) =>
  api.get(`/patients/${id}`).then((res) => res.data);

export const createPatient = (payload) =>
  api.post("/patients", payload).then((res) => res.data);

export const updatePatient = (id, payload) =>
  api.put(`/patients/${id}`, payload).then((res) => res.data);

export const deletePatient = (id) => api.delete(`/patients/${id}`);

// Fetches every patient matching `params`, looping through pages (the
// backend caps pageSize at 100). Used for reports where we need the full
// set to filter/aggregate client-side (e.g. "pasien baru bulan ini").
export const getAllPatients = async (params = {}) => {
  const pageSize = 100;
  let page = 1;
  let all = [];

  while (true) {
    const res = await getPatients({ ...params, page, pageSize });
    all = all.concat(res.data);
    if (page >= res.meta.totalPages) break;
    page += 1;
  }

  return all;
};
