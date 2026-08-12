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

// Fetches every record matching `params`, looping through pages under the
// hood (the backend caps pageSize at 100). Used for exports, where we
// want the full filtered set — not just whatever page is on screen.
export const getAllMedicalRecords = async (params = {}) => {
  const pageSize = 100;
  let page = 1;
  let all = [];

  while (true) {
    const res = await getMedicalRecords({ ...params, page, pageSize });
    all = all.concat(res.data);
    if (page >= res.meta.totalPages) break;
    page += 1;
  }

  return all;
};
