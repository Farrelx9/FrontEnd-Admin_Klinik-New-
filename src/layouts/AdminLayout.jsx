import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const PAGE_TITLES = {
  "/": "Dashboard",
  "/jadwal": "Jadwal Kunjungan",
  "/pasien": "Pasien",
  "/rekam-medis": "Rekam Medis",
  "/layanan": "Layanan & Tindakan",
  "/pembayaran": "Pembayaran",
  "/laporan": "Laporan",
  "/staf": "Dokter & Staf",
  "/pengaturan": "Pengaturan",
};

function resolveTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Fallback for nested routes like /pasien/12
  const base = "/" + pathname.split("/")[1];
  return PAGE_TITLES[base] || "Klinik Senyum";
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          title={resolveTitle(location.pathname)}
        />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
