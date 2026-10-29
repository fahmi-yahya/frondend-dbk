"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppShell, { favorites } from "@/components/AppShell";
import {
  DetailPesanan,
  o,
  statusStyle,
  type Order,
} from "@/components/DetailPesanan";
import { hariDari, tanggalSingkat } from "@/components/RingkasanPesanan";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Cone,
  Cookie,
  MapPin,
  Package,
  Utensils,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Data pesanan                                                        */
/*                                                                     */
/* Acara di kalender = pesanan. 30 pesanan pertama sama dengan yang    */
/* tampil di Dashboard. Pesanan K143–K156 adalah contoh tambahan       */
/* (nomornya mengisi celah di antara K142 dan K157) supaya jadwal      */
/* minggu ini tidak kosong. Ganti dengan sumber data yang sama dengan  */
/* Dashboard kalau sudah ada.                                          */
/*                                                                     */
/* Pesanan yang punya extra.jam tampil di grid jam. Yang belum punya   */
/* jam tampil di baris "Tanpa Jam" di bawah header hari.               */
/* ------------------------------------------------------------------ */

const pesanan: Order[] = [
  // Jan–Feb
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
  // Mar–Apr
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
  // Mei–Jun
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
  // Jul–Agu
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
  // Sep–Okt
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
  // ↓ contoh tambahan (K143–K148)
  o(
    "#K143",
    "PT Maju Jaya",
    "Snack Box ×80",
    "2026-10-20",
    2000000,
    "Lunas",
    "Kantor PT Maju Jaya",
    { jam: "09.00 WIB" },
  ),
  o(
    "#K144",
    "Bu Sari",
    "Tumpeng Mini ×2",
    "2026-10-22",
    850000,
    "Lunas",
    "Rumah Bu Sari, Perumahan Palm",
  ),
  o(
    "#K145",
    "Pak Budi",
    "Nasi Box ×60",
    "2026-10-24",
    1500000,
    "Lunas",
    "Gedung Serbaguna Taman Surya",
    { jam: "11.00 WIB" },
  ),
  o(
    "#K146",
    "Klinik Sehat",
    "Snack Box ×50",
    "2026-10-26",
    1250000,
    "Lunas",
    "Klinik Sehat, Jl. Panjaitan",
    { jam: "09.00 WIB" },
  ),
  o(
    "#K147",
    "SMAN 1 Jember",
    "Nasi Box ×120",
    "2026-10-27",
    3000000,
    "Lunas",
    "Aula SMAN 1 Jember",
    {
      jam: "07.00 WIB",
      keterangan: "Antar lewat pintu samping aula.",
    },
  ),
  o(
    "#K148",
    "Bu Rina",
    "Nasi Box ×50",
    "2026-10-28",
    1250000,
    "Lunas",
    "Rumah Bu Rina, Jl. Mawar No. 12",
    { jam: "16.00 WIB" },
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
  // ↓ contoh tambahan (K150–K156)
  o(
    "#K150",
    "PT Maju Jaya",
    "Nasi Box ×100",
    "2026-10-29",
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
    "#K151",
    "Kantor Desa",
    "Nasi Box ×150",
    "2026-10-30",
    3750000,
    "DP",
    "Balai Desa",
    { jam: "10.00 WIB" },
  ),
  o(
    "#K152",
    "Keluarga Hadi",
    "Prasmanan ×250",
    "2026-10-31",
    18750000,
    "DP",
    "Masjid At-Taqwa",
    {
      hp: "081234567890",
      jam: "10.00 WIB",
      gps: "https://www.google.com/maps?q=Masjid+At-Taqwa",
      sup: "Bakso",
      es: "Es Buah",
      meja: "25",
      taplak: "Putih",
      waiters: "16",
      bonus: ["Dekorasi meja", "Air mineral"],
      keterangan: "Tim dapur mulai memasak pukul 05.00.",
    },
  ),
  o(
    "#K153",
    "Bu Sari",
    "Prasmanan ×40",
    "2026-10-31",
    3800000,
    "Lunas",
    "Rumah Bu Sari, Perumahan Palm",
    { jam: "11.00 WIB" },
  ),
  o(
    "#K154",
    "Bu Rina",
    "Snack Box ×60",
    "2026-11-01",
    1500000,
    "Lunas",
    "Rumah Bu Rina, Jl. Mawar No. 12",
    { jam: "08.00 WIB" },
  ),
  o(
    "#K155",
    "PT Maju Jaya",
    "Nasi Box ×90",
    "2026-11-03",
    2250000,
    "Lunas",
    "Kantor PT Maju Jaya",
    { jam: "12.00 WIB" },
  ),
  o(
    "#K156",
    "SMAN 1 Jember",
    "Snack Box ×200",
    "2026-11-05",
    5000000,
    "DP",
    "Aula SMAN 1 Jember",
    { jam: "09.00 WIB" },
  ),
  // Nov–Des
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
];

/* ------------------------------------------------------------------ */
/* Konstanta kalender                                                  */
/* ------------------------------------------------------------------ */

const START_HOUR = 6;
const END_HOUR = 20;
const ROW_H = 80; // tinggi satu jam (px)
const TIME_COL = 64; // lebar kolom jam (px)
const DAY_MIN = 176; // lebar minimum kolom hari (px)
const kolomGrid = (jumlahHari: number) =>
  `${TIME_COL}px repeat(${jumlahHari}, minmax(${DAY_MIN}px, 1fr))`;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i,
);
const GRID_H = HOURS.length * ROW_H;

// Pesanan baru punya jam mulai, belum ada jam selesai.
// Kartu di kalender digambar selama durasi ini.
const DURASI_ACARA = 2;

// "Hari ini" untuk data contoh di atas. Ganti dengan new Date() kalau sudah
// memakai data asli.
const DEMO_TODAY = new Date(2026, 9, 29);

const card = "rounded-2xl border border-white/10 bg-[#141414]";
const label = "font-mono text-xs text-neutral-400";

/* ------------------------------------------------------------------ */
/* Tanggal                                                             */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const todayKey = toKey(DEMO_TODAY);

/** "29 Okt" */
const tglPendek = (iso: string) =>
  tanggalSingkat(iso).split(" ").slice(0, 2).join(" ");
/** "SEN" */
const hariPendek = (iso: string) => hariDari(iso).slice(0, 3).toUpperCase();
const jamLabel = (h: number) => `${pad(h)}.00`;

/* Bulan dipakai dalam bentuk "2026-10" */
const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const bulanDari = (iso: string) => iso.slice(0, 7);
const namaBulan = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${NAMA_BULAN[m - 1]} ${y}`;
};
/** ["2026-10-01", …, "2026-10-31"] */
const hariDalamBulan = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  const jumlah = new Date(y, m, 0).getDate();
  return Array.from({ length: jumlah }, (_, i) => `${ym}-${pad(i + 1)}`);
};

const bulanIniKey = bulanDari(todayKey);

// Isi dropdown: dari bulan pesanan paling awal sampai paling akhir,
// selalu termasuk bulan ini.
const DAFTAR_BULAN = (() => {
  const semua = [
    ...pesanan.map((p) => bulanDari(p.tanggal)),
    bulanIniKey,
  ].sort();
  const [y0, m0] = semua[0].split("-").map(Number);
  const [y1, m1] = semua[semua.length - 1].split("-").map(Number);
  const out: string[] = [];
  let y = y0;
  let m = m0;
  while (y < y1 || (y === y1 && m <= m1)) {
    out.push(`${y}-${pad(m)}`);
    if (++m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
})();

/* ------------------------------------------------------------------ */
/* Pesanan → acara                                                     */
/* ------------------------------------------------------------------ */

// "10.00 WIB" → 10, "16.30 WIB" → 16.5, kosong → null
const jamMulai = (p: Order): number | null => {
  const m = p.extra.jam?.match(/(\d{1,2})[.:](\d{2})/);
  return m ? Number(m[1]) + Number(m[2]) / 60 : null;
};

type Terjadwal = { order: Order; start: number; end: number };

const PER_HARI = (() => {
  const map = new Map<string, { terjadwal: Terjadwal[]; tanpaJam: Order[] }>();
  for (const p of pesanan) {
    const b = map.get(p.tanggal) ?? { terjadwal: [], tanpaJam: [] };
    const start = jamMulai(p);
    if (start === null) b.tanpaJam.push(p);
    else b.terjadwal.push({ order: p, start, end: start + DURASI_ACARA });
    map.set(p.tanggal, b);
  }
  for (const b of map.values()) b.terjadwal.sort((a, c) => a.start - c.start);
  return map;
})();

// Ikon sesuai jenis paket
const ikonPaket = (item: string): LucideIcon => {
  const p = item.toLowerCase();
  if (p.startsWith("tumpeng")) return Cone;
  if (p.startsWith("snack")) return Cookie;
  if (p.startsWith("prasmanan")) return Utensils;
  return Package; // Nasi Box
};

// Warna avatar sama dengan "Pelanggan Tetap" di sidebar
const warnaPelanggan = (nama: string) =>
  favorites.find((f) => f.name === nama)?.color ??
  "bg-neutral-700 text-neutral-200";

/* ------------------------------------------------------------------ */
/* Acara yang jamnya bertabrakan dibagi ke beberapa jalur              */
/* ------------------------------------------------------------------ */

type Ditata = Terjadwal & { lane: number; lanes: number };

function tataHari(items: Terjadwal[]): Ditata[] {
  const out: Ditata[] = [];
  let cluster: Ditata[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const lanes = laneEnds.length;
    for (const c of cluster) out.push({ ...c, lanes });
    cluster = [];
    laneEnds = [];
    clusterEnd = -1;
  };

  for (const it of items) {
    if (cluster.length && it.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= it.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(it.end);
    } else {
      laneEnds[lane] = it.end;
    }
    cluster.push({ ...it, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, it.end);
  }
  flush();
  return out;
}

/* ------------------------------------------------------------------ */
/* Komponen kecil                                                      */
/* ------------------------------------------------------------------ */

function Avatar({
  nama,
  kecil = false,
  className = "",
}: {
  nama: string;
  kecil?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-bold ${
        kecil ? "size-4 text-[9px]" : "size-5 text-[10px]"
      } ${warnaPelanggan(nama)} ${className}`}
    >
      {nama[0]}
    </span>
  );
}

function KartuAcara({
  item,
  onBuka,
}: {
  item: Ditata;
  onBuka: (p: Order) => void;
}) {
  const { order: p, start, end, lane, lanes } = item;
  const Ikon = ikonPaket(p.item);
  const atas = Math.min(Math.max(start, START_HOUR), END_HOUR - 0.5);
  const tinggi = Math.max((Math.min(end, END_HOUR) - atas) * ROW_H - 4, 36);
  const lebar = lanes === 1;
  const batal = p.status === "Batal";

  return (
    <button
      type="button"
      onClick={() => onBuka(p)}
      title="Klik untuk melihat detail pesanan"
      className={`absolute flex flex-col gap-1.5 overflow-hidden rounded-xl border border-white/10 bg-[#1b1b1b] p-2.5 text-left transition-colors hover:border-white/25 focus-visible:border-orange-500/60 focus-visible:outline-none ${
        batal ? "opacity-50" : ""
      }`}
      style={{
        top: (atas - START_HOUR) * ROW_H + 2,
        height: tinggi,
        left: `calc(${(lane / lanes) * 100}% + 4px)`,
        width: `calc(${100 / lanes}% - 8px)`,
      }}
    >
      <span className="flex items-start gap-2">
        {lebar && <Avatar nama={p.customer} className="mt-px" />}
        <span
          className={`line-clamp-2 text-[13px] font-medium leading-snug text-neutral-100 ${
            batal ? "line-through" : ""
          }`}
        >
          {p.customer}
        </span>
      </span>

      <span className="flex flex-wrap items-center justify-between gap-1">
        <span className="font-mono text-[11px] text-neutral-400">
          {p.extra.jam}
        </span>
        <span
          className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${statusStyle[p.status]}`}
        >
          {p.status}
        </span>
      </span>

      {tinggi >= 96 && (
        <span className="flex items-center gap-1.5 text-xs text-neutral-300">
          <Ikon className="size-3.5 shrink-0 text-neutral-500" />
          <span className="truncate">{p.item}</span>
        </span>
      )}

      {tinggi >= 140 && (
        <span className="flex items-start gap-1.5 text-xs text-neutral-500">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          <span className="line-clamp-2">{p.lokasi}</span>
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Halaman                                                             */
/* ------------------------------------------------------------------ */

export default function JadwalAcaraPage() {
  const [bulan, setBulan] = useState(bulanIniKey);
  const [selected, setSelected] = useState(todayKey);
  const [sel, setSel] = useState<Order | null>(null);
  const [nowHour, setNowHour] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const hariKeys = hariDalamBulan(bulan);
  const cols = kolomGrid(hariKeys.length);

  const jumlahAcara = pesanan.filter(
    (p) => p.tanggal.startsWith(bulan) && p.status !== "Batal",
  ).length;

  // Garis "sekarang"
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setNowHour(n.getHours() + n.getMinutes() / 60);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Gulir ke kolom hari terpilih & acara pertamanya saat pindah bulan
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const kolom = el.querySelector<HTMLElement>(`[data-day="${selected}"]`);
    const jadwal = PER_HARI.get(selected)?.terjadwal ?? [];
    const awal = jadwal.length ? jadwal[0].start : START_HOUR + 1;
    el.scrollTo({
      left: Math.max(0, (kolom?.offsetLeft ?? 0) - TIME_COL),
      top: Math.max(0, (awal - START_HOUR - 0.5) * ROW_H),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulan]);

  // Bulan ini → langsung ke hari ini; bulan lain → tanggal 1
  const gantiBulan = (ym: string) => {
    setBulan(ym);
    setSelected(ym === bulanIniKey ? todayKey : `${ym}-01`);
  };

  return (
    <AppShell active="jadwal">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm">
            <CalendarDays className="size-4 text-neutral-400" /> Jadwal Acara
          </span>
          <span className={label}>
            {jumlahAcara} Acara{" "}
            {bulan === bulanIniKey ? "Bulan Ini" : `di ${namaBulan(bulan)}`}
          </span>
        </div>
        <div className="flex items-center gap-3">
         
          <button
            aria-label="Notifikasi"
            className="grid size-9 place-items-center rounded-lg border border-white/10 text-neutral-400 hover:text-white"
          >
            <Bell className="size-4" />
          </button>
          <div className="grid size-9 place-items-center rounded-full bg-orange-500 text-sm font-semibold text-black">
            A
          </div>
        </div>
      </header>

      <div className="space-y-5 px-6 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-medium">Jadwal Acara</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Klik salah satu acara untuk melihat detail pesanan.
            </p>
          </div>
          <div className="relative">
            <select
              aria-label="Pilih bulan"
              value={bulan}
              onChange={(e) => gantiBulan(e.target.value)}
              className="h-9 cursor-pointer appearance-none rounded-lg border border-white/10 bg-transparent pl-3 pr-9 text-sm text-neutral-200 transition-colors hover:bg-white/5 hover:text-white focus-visible:border-orange-500/60 focus-visible:outline-none [color-scheme:dark]"
            >
              {DAFTAR_BULAN.map((b) => (
                <option key={b} value={b}>
                  {namaBulan(b)}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
            />
          </div>
        </div>

        <div className="h-[70vh] lg:h-[calc(100vh-13.5rem)] lg:min-h-[560px]">
          {/* Kalender bulanan: satu kolom per hari, geser ke samping */}
          <section className={`${card} h-full overflow-hidden`}>
            <div ref={scroller} className="h-full overflow-auto">
              <div
                className="relative"
                style={{ minWidth: TIME_COL + DAY_MIN * hariKeys.length }}
              >
                {/* Header hari + baris tanpa jam */}
                <div className="sticky top-0 z-30 border-b border-white/10 bg-[#141414]">
                  <div className="grid" style={{ gridTemplateColumns: cols }}>
                    <div className="sticky left-0 z-10 flex items-center justify-center bg-[#141414] p-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-neutral-300">
                        WIB
                      </span>
                    </div>
                    {hariKeys.map((key) => {
                      const dipilih = key === selected;
                      return (
                        <button
                          key={key}
                          data-day={key}
                          aria-pressed={dipilih}
                          aria-label={`${hariDari(key)}, ${tglPendek(key)}`}
                          onClick={() => setSelected(key)}
                          className={`flex flex-col items-center gap-0.5 border-l border-white/10 py-3 transition-colors ${
                            dipilih
                              ? "bg-white/[0.04] shadow-[inset_0_-2px_0_0_white]"
                              : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <span
                            className={`text-2xl font-medium ${
                              key === todayKey
                                ? "text-orange-500"
                                : "text-neutral-100"
                            }`}
                          >
                            {Number(key.slice(8))}
                          </span>
                          <span className={label}>{hariPendek(key)}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className="grid border-t border-white/10"
                    style={{ gridTemplateColumns: cols }}
                  >
                    <div className="sticky left-0 z-10 bg-[#141414] px-2 py-2.5 text-right font-mono text-[10px] leading-4 text-neutral-500">
                      TANPA JAM
                    </div>
                    {hariKeys.map((key) => (
                      <div
                        key={key}
                        className="flex min-h-10 flex-col gap-1 border-l border-white/10 p-1"
                      >
                        {(PER_HARI.get(key)?.tanpaJam ?? []).map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSel(p)}
                            title={`${p.customer} · ${p.item}`}
                            className={`flex items-center gap-1.5 rounded-md bg-white/[0.06] px-1.5 py-1 text-left text-[11px] text-neutral-200 transition-colors hover:bg-white/10 ${
                              p.status === "Batal" ? "opacity-50" : ""
                            }`}
                          >
                            <Avatar nama={p.customer} kecil />
                            <span className="truncate">
                              {p.customer} · {p.item}
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grid jam */}
                <div className="grid" style={{ gridTemplateColumns: cols }}>
                  <div
                    className="sticky left-0 z-10 bg-[#141414]"
                    style={{ height: GRID_H }}
                  >
                    {HOURS.map((h, i) => (
                      <span
                        key={h}
                        className="absolute right-2 font-mono text-[11px] text-neutral-500"
                        style={{
                          top: i * ROW_H,
                          transform:
                            i === 0 ? "translateY(4px)" : "translateY(-50%)",
                        }}
                      >
                        {jamLabel(h)}
                      </span>
                    ))}
                  </div>

                  {hariKeys.map((key) => {
                    const ditata = tataHari(PER_HARI.get(key)?.terjadwal ?? []);
                    const tampilGaris =
                      key === todayKey &&
                      nowHour !== null &&
                      nowHour >= START_HOUR &&
                      nowHour <= END_HOUR;
                    return (
                      <div
                        key={key}
                        className={`relative border-l border-white/10 ${
                          key === selected ? "bg-white/[0.02]" : ""
                        }`}
                        style={{
                          height: GRID_H,
                          backgroundImage:
                            "linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
                          backgroundSize: `100% ${ROW_H}px`,
                        }}
                      >
                        {ditata.map((it) => (
                          <KartuAcara
                            key={it.order.id}
                            item={it}
                            onBuka={setSel}
                          />
                        ))}
                        {tampilGaris && (
                          <div
                            className="pointer-events-none absolute inset-x-0 z-[5] flex items-center"
                            style={{ top: (nowHour! - START_HOUR) * ROW_H }}
                          >
                            <span className="-ml-1 size-2 rounded-full bg-orange-500" />
                            <span className="h-px flex-1 bg-orange-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {sel && <DetailPesanan order={sel} onClose={() => setSel(null)} />}
    </AppShell>
  );
}
