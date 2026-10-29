"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  ChefHat,
  Users,
  CalendarDays,
  TrendingUp,
  ChevronDown,
  Search,
  PanelLeft,
} from "lucide-react";

// `active` pada AppShell boleh diisi id ("jadwal") atau label ("Jadwal Acara").
const nav = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    id: "pesanan",
    label: "Pesanan",
    icon: ClipboardList,
    href: "/pesanan/baru",
    sub: true,
  },
  {
    id: "menu",
    label: "Menu & Paket",
    icon: ChefHat,
    href: "/dashboard/menu",
    sub: true,
  },
  
  {
    id: "jadwal",
    label: "Jadwal Acara",
    icon: CalendarDays,
    href: "/dashboard/jadwal",
    sub: true,
  },
];

export const favorites = [
  { name: "PT Maju Jaya", type: "KANTOR", color: "bg-neutral-200 text-black" },
  { name: "Bu Rina", type: "ARISAN", color: "bg-blue-500 text-white" },
  { name: "Keluarga Hadi", type: "HAJATAN", color: "bg-purple-500 text-white" },
  { name: "SMAN 1 Jember", type: "SEKOLAH", color: "bg-orange-500 text-black" },
];

const label = "font-mono text-xs text-neutral-400";

/* ------------------------------------------------------------------ */
/* Status sidebar (lebar / ringkas)                                    */
/*                                                                     */
/* Disimpan di localStorage karena tiap halaman memasang AppShell      */
/* sendiri, jadi state biasa akan kembali lebar setiap pindah halaman. */
/* ------------------------------------------------------------------ */

const KUNCI = "dapur-nusa:sidebar-ringkas";
const EVENT_SIDEBAR = "dapur-nusa:sidebar-ringkas-berubah";

function langgananSidebar(onChange: () => void) {
  window.addEventListener("storage", onChange); // tab lain
  window.addEventListener(EVENT_SIDEBAR, onChange); // tab ini
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT_SIDEBAR, onChange);
  };
}

function bacaSidebar() {
  try {
    return localStorage.getItem(KUNCI) === "1";
  } catch {
    return false;
  }
}

function simpanSidebar(ringkas: boolean) {
  try {
    localStorage.setItem(KUNCI, ringkas ? "1" : "0");
  } catch {
    /* penyimpanan dinonaktifkan: abaikan */
  }
  window.dispatchEvent(new Event(EVENT_SIDEBAR));
}

export default function AppShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  // Server selalu merender versi lebar; versi tersimpan dipakai setelah hydrate.
  const ringkas = useSyncExternalStore(
    langgananSidebar,
    bacaSidebar,
    () => false,
  );
  // Animasi lebar hanya setelah tombol ditekan, supaya halaman yang dibuka
  // dalam keadaan ringkas tidak "menciut" dulu saat dimuat.
  const [animasi, setAnimasi] = useState(false);

  const toggle = () => {
    setAnimasi(true);
    simpanSidebar(!ringkas);
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-[#0c0c0c] text-neutral-100 [color-scheme:dark]">
      <aside
        id="sidebar"
        className={`hidden shrink-0 flex-col gap-5 overflow-x-hidden overflow-y-auto border-r border-white/10 bg-[#141414] md:flex ${
          ringkas ? "w-[4.5rem] p-3" : "w-72 p-4"
        } ${animasi ? "transition-[width] duration-200" : ""}`}
      >
        <div
          className={`flex ${
            ringkas
              ? "flex-col items-center gap-3"
              : "items-center justify-between"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-neutral-800">
              <div className="grid size-5 place-items-center rounded-full bg-orange-500">
                <div className="size-2 rounded-full bg-neutral-900" />
              </div>
            </div>
            {!ringkas && (
              <span className="whitespace-nowrap text-lg font-medium">
                DBK
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-controls="sidebar"
            aria-expanded={!ringkas}
            aria-label={ringkas ? "Buka sidebar" : "Tutup sidebar"}
            title={ringkas ? "Buka sidebar" : "Tutup sidebar"}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
          >
            <PanelLeft className="size-5" />
          </button>
        </div>

        <button
          type="button"
          aria-label={ringkas ? "Cari pesanan" : undefined}
          title={ringkas ? "Cari pesanan (⌘ K)" : undefined}
          className={`flex items-center rounded-xl border border-white/5 bg-white/5 py-2.5 text-sm text-neutral-300 ${
            ringkas ? "justify-center" : "justify-between px-3"
          }`}
        >
          <span className="flex items-center gap-2 whitespace-nowrap">
            <Search className="size-4 shrink-0" />
            {!ringkas && "Cari pesanan"}
          </span>
          {!ringkas && (
            <kbd className="font-mono text-xs text-neutral-400">⌘ K</kbd>
          )}
        </button>

        <hr className="border-white/10" />

        <div className="flex flex-col gap-2">
          {!ringkas && <p className={label}>Menu</p>}
          <nav className="flex flex-col gap-1">
            {nav.map(({ id, label: name, icon: Icon, href, sub }) => {
              const aktif = active === id || active === name;
              return (
                <Link
                  key={id}
                  href={href}
                  aria-current={aktif ? "page" : undefined}
                  aria-label={ringkas ? name : undefined}
                  title={ringkas ? name : undefined}
                  className={`flex items-center rounded-xl py-2.5 text-sm transition-colors ${
                    ringkas ? "justify-center" : "justify-between px-3"
                  } ${
                    aktif
                      ? "bg-white/10 text-white"
                      : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
                  }`}
                >
                  <span className="flex items-center gap-3 whitespace-nowrap">
                    <Icon className="size-4 shrink-0" />
                    {!ringkas && name}
                  </span>
                  {sub && !ringkas && <ChevronDown className="size-4" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <hr className="border-white/10" />

        {/* <div className="flex flex-col gap-2">
          {!ringkas && <p className={label}>Pelanggan Tetap</p>}
          <ul className="flex flex-col">
            {favorites.map((f) => (
              <li
                key={f.name}
                title={ringkas ? `${f.name} · ${f.type}` : undefined}
                className={`flex items-center py-2 text-sm ${
                  ringkas ? "justify-center" : "justify-between px-3"
                }`}
              >
                <span className="flex items-center gap-3 whitespace-nowrap">
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${f.color}`}
                  >
                    {f.name[0]}
                  </span>
                  {ringkas ? <span className="sr-only">{f.name}</span> : f.name}
                </span>
                {!ringkas && (
                  <span className="font-mono text-xs text-neutral-500">
                    {f.type}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div> */}
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
