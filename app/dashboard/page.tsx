"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import {
  AreaCetak,
  RingkasanPesanan,
  tanggalLengkap,
  tanggalSingkat,
  type DataRingkasan,
} from "@/components/RingkasanPesanan";
import {
  LayoutDashboard,
  TrendingUp,
  Bell,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const stats = [
  { label: "Total Pesanan", value: "142", delta: "+8.2%", up: true },
  {
    label: "Pendapatan",
    value: "37 jt",
    prefix: "Rp",
    delta: "+12.5%",
    up: true,
  },
  { label: "Pelanggan Baru", value: "32", delta: "-4.3%", up: false },
  { label: "Pelanggan Repeat", value: "42 %", delta: "+2.1%", up: true },
];

const products = [
  {
    name: "Nasi Box Ayam Bakar",
    income: "Rp 18,2 jt",
    orders: 96,
    growth: 32,
    portions: "1.240",
    rating: "4.9",
  },
  {
    name: "Tumpeng Mini",
    income: "Rp 12,6 jt",
    orders: 58,
    growth: 26,
    portions: "410",
    rating: "4.8",
  },
  {
    name: "Snack Box Premium",
    income: "Rp 9,4 jt",
    orders: 74,
    growth: 13,
    portions: "890",
    rating: "4.7",
  },
  {
    name: "Prasmanan Pernikahan",
    income: "Rp 8,1 jt",
    orders: 11,
    growth: -11,
    portions: "650",
    rating: "4.6",
  },
];

// Data tambahan yang muncul di detail pesanan (semuanya boleh dikosongkan;
// bagian yang kosong otomatis disembunyikan di detail)
type Extra = {
  hp?: string;
  jam?: string;
  gps?: string;
  sup?: string;
  es?: string;
  dataTambahan?: string;
  meja?: string;
  taplak?: string;
  waiters?: string;
  bonus?: string[];
  keterangan?: string;
};

type Order = {
  id: string;
  customer: string;
  item: string; // contoh: "Nasi Box ×80" (nama paket ×jumlah)
  tanggal: string; // format "2026-03-19"
  lokasi: string;
  amount: number;
  status: "Lunas" | "DP" | "Batal";
  extra: Extra;
};
const o = (
  id: string,
  customer: string,
  item: string,
  tanggal: string,
  amount: number,
  status: Order["status"],
  lokasi: string,
  extra: Extra = {},
): Order => ({
  id,
  customer,
  item,
  tanggal,
  lokasi,
  amount,
  status,
  extra,
});
const statusStyle: Record<Order["status"], string> = {
  Lunas: "bg-green-500/15 text-green-400",
  DP: "bg-amber-500/15 text-amber-400",
  Batal: "bg-red-500/15 text-red-400",
};

// Ubah satu pesanan menjadi data untuk ringkasan / detail pesanan
const detailDari = (od: Order): DataRingkasan => {
  const [paket, qty = ""] = od.item.split(" ×");
  const x = od.extra;
  return {
    noPesanan: od.id,
    tanggal: tanggalLengkap(od.tanggal),
    jam: x.jam ?? "",
    nama: od.customer,
    hp: x.hp ?? "",
    lokasi: od.lokasi,
    gps: x.gps ?? "",
    menu: [
      { label: "Paket", nilai: paket },
      { label: "Pilihan Sup", nilai: x.sup ?? "" },
      { label: "Pilihan Es", nilai: x.es ?? "" },
      { label: "Data Tambahan", nilai: x.dataTambahan ?? "" },
    ],
    jumlah: qty,
    kebutuhan: [
      { label: "Jumlah Meja", nilai: x.meja ?? "" },
      { label: "Warna Taplak", nilai: x.taplak ?? "" },
      { label: "Waiters", nilai: x.waiters ?? "" },
    ],
    bonus: x.bonus ?? [],
    keterangan: x.keterangan ?? "",
  };
};

// Tiap batang = 2 bulan. value = total pesanan, income = pendapatan periode itu.
const periods = [
  {
    label: "Jan–Feb",
    value: 188,
    income: "Rp 49 jt",
    orders: [
      o(
        "#K001",
        "Bu Rina",
        "Tumpeng Mini ×2",
        "2026-01-04",
        850000,
        "Lunas",
        "Rumah Bu Rina, Jl. Mawar No. 12",
      ),
      o(
        "#K006",
        "PT Maju Jaya",
        "Nasi Box ×80",
        "2026-01-18",
        2400000,
        "Lunas",
        "Kantor PT Maju Jaya",
      ),
      o(
        "#K011",
        "Pak Budi",
        "Snack Box ×40",
        "2026-02-02",
        1000000,
        "DP",
        "Gedung Serbaguna Taman Surya",
      ),
      o(
        "#K015",
        "SMAN 1 Jember",
        "Nasi Box ×120",
        "2026-02-14",
        3000000,
        "Lunas",
        "Aula SMAN 1 Jember",
      ),
      o(
        "#K019",
        "Bu Sari",
        "Prasmanan ×30",
        "2026-02-26",
        2850000,
        "Lunas",
        "Rumah Bu Sari, Perumahan Palm",
      ),
    ],
  },
  {
    label: "Mar–Apr",
    value: 262,
    income: "Rp 68 jt",
    orders: [
      o(
        "#K024",
        "Klinik Sehat",
        "Snack Box ×60",
        "2026-03-05",
        1500000,
        "Lunas",
        "Klinik Sehat, Jl. Panjaitan",
      ),
      o(
        "#K031",
        "Keluarga Hadi",
        "Prasmanan ×150",
        "2026-03-19",
        11250000,
        "DP",
        "Masjid At-Taqwa",
        {
          hp: "081234567890",
          jam: "10.00 WIB",
          gps: "https://www.google.com/maps?q=Masjid+At-Taqwa",
          sup: "Bakso",
          es: "Es Buah",
          meja: "15",
          taplak: "Putih",
          waiters: "10",
          bonus: ["Dekorasi meja", "Air mineral"],
          keterangan: "Prasmanan disiapkan 1 jam sebelum acara dimulai.",
        },
      ),
      o(
        "#K037",
        "Bu Rina",
        "Nasi Box ×30",
        "2026-03-28",
        750000,
        "Batal",
        "Rumah Bu Rina, Jl. Mawar No. 12",
      ),
      o(
        "#K043",
        "PT Maju Jaya",
        "Nasi Box ×100",
        "2026-04-09",
        2500000,
        "Lunas",
        "Kantor PT Maju Jaya",
        {
          hp: "082111223344",
          jam: "12.00 WIB",
          keterangan: "Antar ke lobi utama.",
        },
      ),
      o(
        "#K048",
        "Koperasi Tani",
        "Tumpeng ×3",
        "2026-04-22",
        1350000,
        "DP",
        "Balai Koperasi Tani",
      ),
    ],
  },
  {
    label: "Mei–Jun",
    value: 214,
    income: "Rp 56 jt",
    orders: [
      o(
        "#K056",
        "Pak Budi",
        "Nasi Box ×50",
        "2026-05-03",
        1250000,
        "Lunas",
        "Gedung Serbaguna Taman Surya",
      ),
      o(
        "#K062",
        "SMAN 1 Jember",
        "Snack Box ×200",
        "2026-05-17",
        5000000,
        "Lunas",
        "Aula SMAN 1 Jember",
      ),
      o(
        "#K069",
        "Bu Sari",
        "Tumpeng Mini ×1",
        "2026-05-29",
        450000,
        "DP",
        "Rumah Bu Sari, Perumahan Palm",
      ),
      o(
        "#K075",
        "PT Maju Jaya",
        "Nasi Box ×90",
        "2026-06-11",
        2250000,
        "Lunas",
        "Kantor PT Maju Jaya",
      ),
      o(
        "#K080",
        "Klinik Sehat",
        "Snack Box ×45",
        "2026-06-24",
        1125000,
        "Lunas",
        "Klinik Sehat, Jl. Panjaitan",
      ),
    ],
  },
  {
    label: "Jul–Agu",
    value: 341,
    income: "Rp 89 jt",
    orders: [
      o(
        "#K087",
        "Koperasi Tani",
        "Nasi Box ×200",
        "2026-07-02",
        5000000,
        "Lunas",
        "Balai Koperasi Tani",
      ),
      o(
        "#K094",
        "Keluarga Hadi",
        "Prasmanan ×200",
        "2026-07-15",
        15000000,
        "Lunas",
        "Masjid At-Taqwa",
        {
          hp: "081298765432",
          jam: "11.00 WIB",
          sup: "Kimlo",
          es: "Es Campur",
          meja: "20",
          taplak: "Merah maroon",
          waiters: "14",
          bonus: ["Dekorasi pelaminan"],
        },
      ),
      o(
        "#K102",
        "Bu Rina",
        "Tumpeng Mini ×4",
        "2026-07-30",
        1700000,
        "Lunas",
        "Rumah Bu Rina, Jl. Mawar No. 12",
      ),
      o(
        "#K109",
        "Kantor Desa",
        "Nasi Box ×300",
        "2026-08-12",
        7500000,
        "DP",
        "Balai Desa",
      ),
      o(
        "#K116",
        "Pak Budi",
        "Snack Box ×80",
        "2026-08-27",
        2000000,
        "Lunas",
        "Gedung Serbaguna Taman Surya",
      ),
    ],
  },
  {
    label: "Sep–Okt",
    value: 280,
    income: "Rp 73 jt",
    orders: [
      o(
        "#K123",
        "PT Maju Jaya",
        "Nasi Box ×120",
        "2026-09-06",
        3000000,
        "Lunas",
        "Kantor PT Maju Jaya",
      ),
      o(
        "#K130",
        "Bu Sari",
        "Prasmanan ×60",
        "2026-09-21",
        5700000,
        "Lunas",
        "Rumah Bu Sari, Perumahan Palm",
      ),
      o(
        "#K135",
        "Klinik Sehat",
        "Snack Box ×50",
        "2026-10-04",
        1250000,
        "Batal",
        "Klinik Sehat, Jl. Panjaitan",
      ),
      o(
        "#K142",
        "SMAN 1 Jember",
        "Nasi Box ×150",
        "2026-10-16",
        3750000,
        "Lunas",
        "Aula SMAN 1 Jember",
      ),
      o(
        "#K149",
        "Keluarga Hadi",
        "Tumpeng ×2",
        "2026-10-29",
        900000,
        "DP",
        "Masjid At-Taqwa",
      ),
    ],
  },
  {
    label: "Nov–Des",
    value: 305,
    income: "Rp 79 jt",
    orders: [
      o(
        "#K157",
        "Koperasi Tani",
        "Nasi Box ×100",
        "2026-11-08",
        2500000,
        "Lunas",
        "Balai Koperasi Tani",
      ),
      o(
        "#K164",
        "Bu Rina",
        "Snack Box ×60",
        "2026-11-24",
        1500000,
        "Lunas",
        "Rumah Bu Rina, Jl. Mawar No. 12",
      ),
      o(
        "#K171",
        "PT Maju Jaya",
        "Prasmanan ×120",
        "2026-12-05",
        11400000,
        "Lunas",
        "Kantor PT Maju Jaya",
      ),
      o(
        "#K178",
        "Kantor Desa",
        "Nasi Box ×180",
        "2026-12-17",
        4500000,
        "DP",
        "Balai Desa",
      ),
      o(
        "#K185",
        "Pak Budi",
        "Tumpeng Mini ×3",
        "2026-12-28",
        1275000,
        "Lunas",
        "Gedung Serbaguna Taman Surya",
      ),
    ],
  },
];
const maxCount = Math.max(...periods.map((r) => r.value));
const totalOrders = periods.reduce((sum, r) => sum + r.value, 0);

const card = "rounded-2xl border border-white/10 bg-[#141414] p-5";
const label = "font-mono text-xs text-neutral-400";

/* ------------------------------------------------------------------ */
/* Detail pesanan (muncul saat baris tabel diklik)                      */
/* ------------------------------------------------------------------ */

function DetailPesanan({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  // Tekan Esc untuk menutup
  useEffect(() => {
    const tutup = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", tutup);
    return () => window.removeEventListener("keydown", tutup);
  }, [onClose]);

  const data = detailDari(order);

  return (
    <>
      {createPortal(
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detail pesanan ${order.id}`}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#141414] text-neutral-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-sm text-neutral-200">Detail Pesanan</p>
                <p className={`${label} mt-1`}>
                  {order.id} · Total Rp {order.amount.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${statusStyle[order.status]}`}
                >
                  {order.status}
                </span>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-white/10"
                >
                  <Printer className="size-3.5" /> Cetak
                </button>
                <button
                  onClick={onClose}
                  autoFocus
                  aria-label="Tutup"
                  className="grid size-8 place-items-center rounded-lg border border-white/10 text-neutral-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain bg-neutral-100 p-4 sm:p-6">
              <div className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
                <RingkasanPesanan data={data} sembunyikanKosong />
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
      {/* Versi cetak, hanya dipakai saat tombol Cetak ditekan */}
      <AreaCetak data={data} />
    </>
  );
}

// Jumlah baris per halaman. Naikkan (mis. 10) kalau datanya sudah banyak.
const PER_HAL = 3;

function Pagination({
  total,
  page,
  perPage,
  onPage,
}: {
  total: number;
  page: number;
  perPage: number;
  onPage: (n: number) => void;
}) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  const nomor: (number | "…")[] = [];
  for (let n = 1; n <= pages; n++) {
    if (pages <= 5 || n === 1 || n === pages || Math.abs(n - page) <= 1)
      nomor.push(n);
    else if (nomor[nomor.length - 1] !== "…") nomor.push("…");
  }
  const tombol =
    "grid size-8 place-items-center rounded-lg text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <nav
      aria-label="Navigasi halaman"
      className="mt-4 flex flex-col items-center justify-between gap-3 text-xs text-neutral-500 sm:flex-row"
    >
      <p>
        Menampilkan {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)}{" "}
        dari {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          aria-label="Halaman sebelumnya"
          className={`${tombol} text-neutral-400 hover:bg-white/5`}
        >
          <ChevronLeft className="size-4" />
        </button>
        {nomor.map((n, i) =>
          n === "…" ? (
            <span key={`titik-${i}`} className="px-1">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPage(n)}
              aria-current={n === page ? "page" : undefined}
              className={`${tombol} ${
                n === page
                  ? "bg-white/10 text-neutral-100"
                  : "text-neutral-400 hover:bg-white/5"
              }`}
            >
              {n}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page === pages}
          aria-label="Halaman berikutnya"
          className={`${tombol} text-neutral-400 hover:bg-white/5`}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  );
}

export default function DashboardPage() {
  const [rb, setRb] = useState(3);
  const [sel, setSel] = useState<Order | null>(null);
  const [hal, setHal] = useState(1);
  const [halMenu, setHalMenu] = useState(1);
  const cur = periods[rb];

  const halOrder = Math.min(
    hal,
    Math.max(1, Math.ceil(cur.orders.length / PER_HAL)),
  );
  const orderTampil = cur.orders.slice(
    (halOrder - 1) * PER_HAL,
    halOrder * PER_HAL,
  );
  const halMenuAman = Math.min(
    halMenu,
    Math.max(1, Math.ceil(products.length / PER_HAL)),
  );
  const menuTampil = products.slice(
    (halMenuAman - 1) * PER_HAL,
    halMenuAman * PER_HAL,
  );
  // Ganti periode (batang grafik) -> kembali ke halaman 1
  const pilihPeriode = (i: number) => {
    if (i !== rb) {
      setRb(i);
      setHal(1);
    }
  };

  return (
    <AppShell active="Dashboard">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm">
            <LayoutDashboard className="size-4 text-neutral-400" /> Dashboard
          </span>
          <span className={label}>14 Pesanan Aktif</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pesanan/baru"
            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
          >
            + Pesanan Baru
          </Link>
          <button className="grid size-9 place-items-center rounded-lg border border-white/10 text-neutral-400 hover:text-white">
            <Bell className="size-4" />
          </button>
          <div className="grid size-9 place-items-center rounded-full bg-orange-500 text-sm font-semibold text-black">
            A
          </div>
        </div>
      </header>

      <div className="space-y-5 px-6 pb-10">
        <h1 className="text-3xl font-medium">Selamat pagi, Admin</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-[#141414] p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-300">{s.label}</p>
                <span
                  className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] ${
                    s.up
                      ? "bg-indigo-500/15 text-indigo-300"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {s.up ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {s.delta}
                </span>
              </div>
              <p className="mt-2 text-2xl font-medium">
                {s.prefix && (
                  <span className="text-orange-500">{s.prefix} </span>
                )}
                {s.value}
              </p>
              <p className="mt-3 font-mono text-[10px] text-neutral-500">
                1 Okt – 29 Okt 2026
              </p>
            </div>
          ))}
        </div>

        {/* Revenue + orders of the hovered period */}
        <div className="grid gap-4 xl:grid-cols-[5fr_8fr]">
          <section className={card}>
            <p className={label}>Total Pesanan</p>
            <p className="mt-1 font-mono text-2xl">
              {totalOrders.toLocaleString("id-ID")}
            </p>
            <p className="mt-2 font-mono text-xs">
              <span className="text-red-500">2,5% ↓</span>{" "}
              <span className="text-neutral-500">Dibanding periode lalu</span>
            </p>
            <div className="relative mt-10 h-56">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="absolute inset-x-0 border-t border-white/5"
                  style={{ top: `${i * 33.3}%` }}
                />
              ))}
              <div
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/30"
                style={{ bottom: `${(periods[rb].value / maxCount) * 100}%` }}
              />
              <div className="relative flex h-full gap-2 sm:gap-3">
                {periods.map((r, i) => (
                  <div
                    key={r.label}
                    className="flex flex-1 items-end"
                    onMouseEnter={() => pilihPeriode(i)}
                    onClick={() => pilihPeriode(i)}
                  >
                    <div
                      className={`relative w-full rounded-lg transition-all ${
                        i === rb
                          ? "bg-gradient-to-b from-white via-orange-500 to-orange-600"
                          : "bg-gradient-to-b from-neutral-700 to-neutral-800"
                      }`}
                      style={{ height: `${(r.value / maxCount) * 100}%` }}
                    >
                      {i === rb && (
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-neutral-900 px-2.5 py-1 font-mono text-[11px]">
                          {r.value} pesanan
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex gap-2 sm:gap-3">
              {periods.map((r, i) => (
                <span
                  key={r.label}
                  className={`flex-1 text-center font-mono text-[10px] leading-tight ${
                    i === rb ? "text-white" : "text-neutral-500"
                  }`}
                >
                  {r.label}
                </span>
              ))}
            </div>
          </section>

          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-neutral-300">Pesanan {cur.label}</p>
                <p className={`${label} mt-1`}>
                  {cur.value} pesanan · menampilkan {cur.orders.length}
                </p>
              </div>
              <span className="rounded-md bg-orange-500/15 px-2 py-1 font-mono text-xs text-orange-400">
                Pendapatan {cur.income}
              </span>
            </div>

            {/* Tabel Tanggal | Lokasi — klik baris untuk melihat detail */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="bg-white/5 text-left text-[11px] uppercase text-neutral-400">
                    <th className="w-28 px-3 py-2.5 font-medium first:rounded-l-lg sm:w-44">
                      Tanggal
                    </th>
                    <th className="px-3 py-2.5 font-medium last:rounded-r-lg">
                      Lokasi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orderTampil.map((od) => (
                    <tr
                      key={od.id}
                      tabIndex={0}
                      title="Klik untuk melihat detail pesanan"
                      onClick={() => setSel(od)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSel(od);
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none"
                    >
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-neutral-400">
                        {tanggalSingkat(od.tanggal)}
                      </td>
                      <td className="break-words px-3 py-3">{od.lokasi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Klik salah satu baris untuk melihat detail pesanan.
            </p>
            <Pagination
              total={cur.orders.length}
              page={halOrder}
              perPage={PER_HAL}
              onPage={setHal}
            />
          </section>
        </div>

        {/* Top products */}
        <div className="grid gap-4">
          <section className={card}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-300">Menu Terlaris</p>
              <button className="text-xs text-neutral-500 hover:text-neutral-300">
                Lihat Semua
              </button>
            </div>
            {/* Layar lebar: tabel */}
            <div className="mt-4 hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-left text-[11px] uppercase text-neutral-400">
                    {[
                      "Menu",
                      "Pendapatan",
                      "Pesanan",
                      "Pertumbuhan",
                      "Porsi",
                      "Rating",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 font-medium first:rounded-l-lg last:rounded-r-lg"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {menuTampil.map((p) => (
                    <tr key={p.name}>
                      <td className="px-3 py-3">{p.name}</td>
                      <td className="px-3 py-3 font-mono">{p.income}</td>
                      <td className="px-3 py-3 font-mono">{p.orders}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`flex items-center gap-1 font-mono ${p.growth > 0 ? "text-indigo-300" : "text-red-400"}`}
                        >
                          {p.growth > 0 ? (
                            <ArrowUpRight className="size-3.5" />
                          ) : (
                            <ArrowDownRight className="size-3.5" />
                          )}
                          {Math.abs(p.growth)}%
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono">{p.portions}</td>
                      <td className="px-3 py-3 font-mono">{p.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Layar kecil: satu kartu per menu, tanpa geser kiri-kanan */}
            <ul className="mt-4 divide-y divide-white/5 lg:hidden">
              {menuTampil.map((p) => (
                <li key={p.name} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words text-sm font-medium">
                      {p.name}
                    </p>
                    <span className="shrink-0 font-mono text-sm">
                      {p.income}
                    </span>
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-neutral-500">
                    <span>{p.orders} pesanan</span>
                    <span>{p.portions} porsi</span>
                    <span>★ {p.rating}</span>
                    <span
                      className={`flex items-center gap-0.5 ${p.growth > 0 ? "text-indigo-300" : "text-red-400"}`}
                    >
                      {p.growth > 0 ? (
                        <ArrowUpRight className="size-3.5" />
                      ) : (
                        <ArrowDownRight className="size-3.5" />
                      )}
                      {Math.abs(p.growth)}%
                    </span>
                  </p>
                </li>
              ))}
            </ul>

            <Pagination
              total={products.length}
              page={halMenuAman}
              perPage={PER_HAL}
              onPage={setHalMenu}
            />
          </section>
        </div>
      </div>

      {sel && <DetailPesanan order={sel} onClose={() => setSel(null)} />}
    </AppShell>
  );
}
