import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";
import AdminLayout from "./layouts/AdminLayout";

import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PatientsPage from "./pages/patients/PatientsPage";
import MedicalRecordsPage from "./pages/records/MedicalRecordsPage";
import AppointmentsPage from "./pages/appointments/AppointmentsPage";
import ServicesPage from "./pages/tindakan/ServicesPage";
import PaymentsPage from "./pages/payments/PaymentsPage";
import ReportsPage from "./pages/reports/ReportsPage";
import StaffPage from "./pages/staff/StaffPage";
import SettingsPage from "./pages/settings/SettingsPage";
import NotFoundPage from "./pages/misc/NotFoundPage";
import ForbiddenPage from "./pages/misc/ForbiddenPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-body)",
              fontSize: "13.5px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
            },
            success: { iconTheme: { primary: "#146464", secondary: "#fff" } },
            error: { iconTheme: { primary: "#E4664B", secondary: "#fff" } },
          }}
        />
        <Routes>
          {/* Guest-only */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Authenticated app shell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/jadwal" element={<AppointmentsPage />} />
              <Route path="/pasien" element={<PatientsPage />} />
              <Route path="/rekam-medis" element={<MedicalRecordsPage />} />
              <Route path="/layanan" element={<ServicesPage />} />
              <Route path="/pembayaran" element={<PaymentsPage />} />
              <Route path="/laporan" element={<ReportsPage />} />
              <Route path="/tindakan" element={<ServicesPage />} />

              {/* Example of a role-restricted route — only admin/dokter can
                  see staff management. Adjust roles to match your API. */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/staf" element={<StaffPage />} />
              </Route>

              <Route path="/pengaturan" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
