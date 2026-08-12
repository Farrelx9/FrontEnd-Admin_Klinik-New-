import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getMedicalRecord } from "../../../services/medicalRecordService";
import {
  PrintToolbar,
  ClinicLetterhead,
  PatientInfoBlock,
  VisitSection,
  SignatureBlock,
} from "./PrintLayout";

export default function PrintMedicalRecordPage() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMedicalRecord(id)
      .then((res) => setRecord(res.data))
      .catch((err) => setError(err.response?.data?.message || "Gagal memuat rekam medis."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg)] print:bg-white">
      <PrintToolbar />

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 print:max-w-none print:px-0 print:py-0">
        {loading ? (
          <p className="font-body text-sm text-[var(--color-muted)]">Memuat…</p>
        ) : error ? (
          <p className="font-body text-sm text-[var(--color-coral)]">{error}</p>
        ) : record ? (
          <>
            <ClinicLetterhead />
            <PatientInfoBlock patient={record.patient} />
            <VisitSection record={record} />
            <SignatureBlock />
          </>
        ) : null}
      </div>
    </div>
  );
}
