import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPatient } from "../../../services/patientService";
import { getAllMedicalRecords } from "../../../services/medicalRecordService";
import {
  PrintToolbar,
  ClinicLetterhead,
  PatientInfoBlock,
  VisitSection,
  SignatureBlock,
} from "./PrintLayout";

export default function PrintPatientHistoryPage() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getPatient(patientId).then((res) => res.data),
      getAllMedicalRecords({ patientId }),
    ])
      .then(([patientData, recordsData]) => {
        setPatient(patientData);
        // Oldest first reads like a proper chronological chart when
        // bundled into one document, unlike the newest-first table view.
        setRecords(
          [...recordsData].sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate))
        );
      })
      .catch((err) => setError(err.response?.data?.message || "Gagal memuat riwayat pasien."))
      .finally(() => setLoading(false));
  }, [patientId]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg)] print:bg-white">
      <PrintToolbar />

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 print:max-w-none print:px-0 print:py-0">
        {loading ? (
          <p className="font-body text-sm text-[var(--color-muted)]">Memuat…</p>
        ) : error ? (
          <p className="font-body text-sm text-[var(--color-coral)]">{error}</p>
        ) : (
          <>
            <ClinicLetterhead />
            <PatientInfoBlock patient={patient} />

            <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Riwayat Kunjungan ({records.length})
            </p>

            {records.length === 0 ? (
              <p className="font-body text-sm text-[var(--color-muted)]">
                Belum ada rekam medis untuk pasien ini.
              </p>
            ) : (
              records.map((r, i) => <VisitSection key={r.id} record={r} index={i} />)
            )}

            <SignatureBlock />
          </>
        )}
      </div>
    </div>
  );
}
