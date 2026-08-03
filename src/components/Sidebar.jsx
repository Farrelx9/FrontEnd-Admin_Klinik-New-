import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FileText,
  Stethoscope,
  Wallet,
  BarChart3,
  UserCog,
  Settings,
} from "lucide-react";
import { LogoLockup } from "./Logo";

const NAV_GROUPS = [
  {
    label: "Utama",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Operasional",
    items: [
      { to: "/jadwal", label: "Jadwal Kunjungan", icon: CalendarDays },
      { to: "/pasien", label: "Pasien", icon: Users },
      { to: "/rekam-medis", label: "Rekam Medis", icon: FileText },
      { to: "/layanan", label: "Layanan & Tindakan", icon: Stethoscope },
    ],
  },
  {
    label: "Bisnis",
    items: [
      { to: "/pembayaran", label: "Pembayaran", icon: Wallet },
      { to: "/laporan", label: "Laporan", icon: BarChart3 },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { to: "/staf", label: "Dokter & Staf", icon: UserCog },
      { to: "/pengaturan", label: "Pengaturan", icon: Settings },
    ],
  },
];

export default function Sidebar({ open, onNavigate }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-200 lg:static lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-16 items-center border-b border-[var(--color-border)] px-5">
        <LogoLockup />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="mb-2 px-3 font-body text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-3 py-2 font-body text-[13.5px] font-medium transition-colors ${
                        isActive
                          ? "bg-[var(--color-teal-700)] text-white"
                          : "text-[var(--color-ink)]/80 hover:bg-[var(--color-mint-200)]/50"
                      }`
                    }
                  >
                    <Icon size={17} strokeWidth={2} />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
