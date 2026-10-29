/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  ChefHat,
  CalendarDays,
  Search,
  PanelLeft,
  Sun,
  Moon,
  X,
  Menu,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

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
  },
  {
    id: "menu",
    label: "Menu & Paket",
    icon: ChefHat,
    href: "/dashboard/menu",
  },
  {
    id: "jadwal",
    label: "Jadwal Acara",
    icon: CalendarDays,
    href: "/dashboard/jadwal",
  },
];

export const favorites = [
  { name: "PT Maju Jaya", type: "KANTOR", color: "bg-neutral-200 text-black" },
  { name: "Bu Rina", type: "ARISAN", color: "bg-blue-500 text-white" },
  { name: "Keluarga Hadi", type: "HAJATAN", color: "bg-purple-500 text-white" },
  { name: "SMAN 1 Jember", type: "SEKOLAH", color: "bg-orange-500 text-black" },
];

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

/* ------------------------------------------------------------------ */
/* Tombol toggle tema                                                   */
/* ------------------------------------------------------------------ */

function ThemeToggle({ ringkas }: { ringkas: boolean }) {
  const { tema, toggleTema } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTema}
      aria-label={
        tema === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"
      }
      title={tema === "dark" ? "Mode terang" : "Mode gelap"}
      className={`flex items-center gap-2 rounded-xl border py-2.5 text-sm transition-colors
        ${ringkas ? "justify-center" : "justify-start px-3"}
        border-[var(--border)] bg-[var(--bg-surface2)] text-[var(--text-muted)]
        hover:border-[var(--border-strong)] hover:text-[var(--text-base)]`}
    >
      {tema === "dark" ? (
        <Sun className="size-4 shrink-0 text-amber-400" />
      ) : (
        <Moon className="size-4 shrink-0 text-indigo-400" />
      )}
      {!ringkas && (
        <span className="whitespace-nowrap text-xs">
          {tema === "dark" ? "Mode Terang" : "Mode Gelap"}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Konten sidebar (dipakai untuk desktop & mobile)                     */
/* ------------------------------------------------------------------ */

// Logo DBK: dua gambar (hitam & terang); yang tampil dipilih lewat class di <html> (lihat tema-css.ts)
function Logo({
  mark = false,
  className = "",
}: {
  mark?: boolean;
  className?: string;
}) {
  const dasar = mark ? "/logo-dbk-mark" : "/logo-dbk";
  return (
    <>
      <img
        src={`${dasar}.png`}
        alt="DBK Catering Service"
        className={`logo-gelap ${className}`}
      />
      <img
        src={`${dasar}-terang.png`}
        alt=""
        aria-hidden="true"
        className={`logo-terang ${className}`}
      />
    </>
  );
}

function SidebarContent({
  ringkas,
  animasi,
  toggle,
  active,
  onLinkClick,
  mobile = false,
}: {
  ringkas: boolean;
  animasi: boolean;
  toggle: () => void;
  active: string;
  onLinkClick?: () => void;
  mobile?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Header logo & toggle */}
      <div
        className={`flex ${
          ringkas
            ? "flex-col items-center gap-3"
            : "items-center justify-between"
        }`}
      >
        <Logo
          mark={ringkas}
          className={ringkas ? "h-auto w-10" : "h-11 w-auto"}
        />
        <button
          type="button"
          onClick={toggle}
          id={mobile ? undefined : "sidebar"}
          aria-expanded={!ringkas}
          aria-label={ringkas ? "Buka sidebar" : "Tutup sidebar"}
          title={ringkas ? "Buka sidebar" : "Tutup sidebar"}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
        >
          {mobile ? <X className="size-5" /> : <PanelLeft className="size-5" />}
        </button>
      </div>

      {/* Search */}
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

      {/* Nav */}
      <div className="flex flex-col gap-2 flex-1">
        {!ringkas && <p className="font-mono text-xs text-neutral-400">Menu</p>}
        <nav className="flex flex-col gap-1">
          {nav.map(({ id, label: name, icon: Icon, href }) => {
            const aktif = active === id || active === name;
            return (
              <Link
                key={id}
                href={href}
                onClick={onLinkClick}
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
              </Link>
            );
          })}
        </nav>
      </div>

      <hr className="border-white/10" />

      {/* Theme toggle di bagian bawah sidebar */}
      <ThemeToggle ringkas={ringkas} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AppShell utama                                                       */
/* ------------------------------------------------------------------ */

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
  // Mobile sidebar open/close
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggle = () => {
    setAnimasi(true);
    simpanSidebar(!ringkas);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ background: "var(--bg-base)", color: "var(--text-base)" }}
    >
      {/* ---- Overlay mobile ---- */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ---- Sidebar Mobile (drawer) ---- */}
      <aside
        aria-label="Navigasi utama"
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-x-hidden overflow-y-auto
          border-r border-white/10 bg-[#141414] p-4 text-[var(--text-sidebar)]
          transition-transform duration-200 ease-in-out md:hidden
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <SidebarContent
          ringkas={false}
          animasi={false}
          mobile
          toggle={() => setMobileSidebarOpen(false)}
          active={active}
          onLinkClick={() => setMobileSidebarOpen(false)}
        />
      </aside>

      {/* ---- Sidebar Desktop ---- */}
      <aside
        id="sidebar-desktop"
        className={`hidden shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-white/10 bg-[#141414] text-[var(--text-sidebar)] md:flex ${
          ringkas ? "w-[4.5rem] p-3" : "w-72 p-4"
        } ${animasi ? "transition-[width] duration-200" : ""}`}
      >
        <SidebarContent
          ringkas={ringkas}
          animasi={animasi}
          toggle={toggle}
          active={active}
        />
      </aside>

      {/* ---- Konten utama ---- */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div
          className="flex shrink-0 items-center gap-3 border-b px-4 py-3 md:hidden"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-surface)",
          }}
        >
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Buka menu"
            aria-expanded={mobileSidebarOpen}
            className="grid size-9 place-items-center rounded-lg border text-[var(--text-muted)] hover:text-[var(--text-base)]"
            style={{ borderColor: "var(--border)" }}
          >
            <Menu className="size-5" />
          </button>
          <Logo className="h-8 w-auto" />
        </div>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
