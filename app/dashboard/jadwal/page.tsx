"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppShell, { favorites } from "@/components/AppShell";
import {
  DetailPesanan,
  statusStyle,
  type Order,
} from "@/components/DetailPesanan";
import { hariDari, tanggalSingkat } from "@/components/RingkasanPesanan";
import { ambilJadwal } from "@/lib/jadwal";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Cone,
  Cookie,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Utensils,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Data pesanan                                                        */
/*                                                                     */
/* Diambil dari GET /api/jadwal?bulan=YYYY-MM lewat ambilJadwal()      */
/* (lihat lib/jadwal.ts). Setiap kali bulan diganti, data bulan itu    */
/* diambil ulang.                                                      */
/*                                                                     */
/* Pesanan yang punya extra.jam tampil di grid jam. Yang belum punya   */
/* jam tampil di baris "Tanpa Jam" di bawah header hari.               */
/* ------------------------------------------------------------------ */

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

const card = "rounded-2xl border border-white/10 bg-[#141414]";
const label = "font-mono text-xs text-neutral-400";

/* ------------------------------------------------------------------ */
/* Tanggal                                                             */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

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
/** "2026-10" digeser n bulan */
const geserBulan = (ym: string, n: number) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
// Isi dropdown: 12 bulan ke belakang sampai 12 bulan ke depan dari bulan ini.
const daftarBulan = (tengah: string) =>
  Array.from({ length: 25 }, (_, i) => geserBulan(tengah, i - 12));

/* ------------------------------------------------------------------ */
/* Pesanan → acara                                                     */
/* ------------------------------------------------------------------ */

// "10.00 WIB" → 10, "16.30 WIB" → 16.5, kosong → null
const jamMulai = (p: Order): number | null => {
  const m = p.extra.jam?.match(/(\d{1,2})[.:](\d{2})/);
  return m ? Number(m[1]) + Number(m[2]) / 60 : null;
};

type Terjadwal = { order: Order; start: number; end: number };

function kelompokkan(pesanan: Order[]) {
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
}

// Ikon sesuai jenis paket
const ikonPaket = (item: string): LucideIcon => {
  const p = item.toLowerCase();
  if (p.startsWith("tumpeng")) return Cone;
  if (p.startsWith("snack")) return Cookie;
  if (p.startsWith("prasmanan")) return Utensils;
  return Package; // Nasi Box
};

// Warna avatar sama dengan "Pelanggan Tetap" di sidebar
const warnaPelanggan = (nama?: string | null) =>
  favorites.find((f) => f.name === nama)?.color ??
  "bg-neutral-700 text-neutral-200";

// Pesanan yang disimpan tanpa nama tetap tampil rapi, tidak kosong
const NAMA_KOSONG = "Tanpa nama";
// customer bisa saja undefined/null kalau API tidak mengirim namanya
const namaBersih = (p: Order) => (p.customer ?? "").trim();
const adaNama = (p: Order) => namaBersih(p) !== "";
const namaTampil = (p: Order) => namaBersih(p) || NAMA_KOSONG;
/** Huruf pertama untuk avatar ("Bu Rina" → "B", kosong → "?") */
const inisial = (nama?: string | null) =>
  (nama ?? "").trim().charAt(0).toUpperCase() || "?";

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
  nama?: string | null;
  kecil?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-bold ${
        kecil ? "size-4 text-[9px]" : "size-5 text-[10px]"
      } ${warnaPelanggan(nama)} ${className}`}
    >
      {inisial(nama)}
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
          className={`line-clamp-2 text-[13px] font-medium leading-snug ${
            adaNama(p) ? "text-neutral-100" : "italic text-neutral-400"
          } ${batal ? "line-through" : ""}`}
        >
          {namaTampil(p)}
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
  // Tanggal "hari ini" baru diisi setelah halaman tampil di browser, supaya
  // tidak beda dengan hasil render server (zona waktu) dan tidak basi.
  const [hariIni, setHariIni] = useState("");
  const [bulan, setBulan] = useState("");
  const [selected, setSelected] = useState("");

  const [pesanan, setPesanan] = useState<Order[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [percobaan, setPercobaan] = useState(0);

  const [sel, setSel] = useState<Order | null>(null);
  const [nowHour, setNowHour] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const bulanIni = bulanDari(hariIni);
  const opsiBulan = hariIni ? daftarBulan(bulanIni) : [];
  const hariKeys = bulan ? hariDalamBulan(bulan) : [];
  const cols = kolomGrid(hariKeys.length);
  const perHari = useMemo(() => kelompokkan(pesanan), [pesanan]);

  const jumlahAcara = pesanan.filter(
    (p) => p.tanggal.startsWith(bulan) && p.status !== "Batal",
  ).length;

  // Mulai dari hari ini
  useEffect(() => {
    const sekarang = toKey(new Date());
    setHariIni(sekarang);
    setBulan(bulanDari(sekarang));
    setSelected(sekarang);
  }, []);

  // Ambil pesanan dari API setiap kali bulan diganti (atau "Coba lagi")
  useEffect(() => {
    if (!bulan) return;
    const ctrl = new AbortController();
    setMemuat(true);
    setGalat(null);

    ambilJadwal(bulan, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setPesanan(data);
        setMemuat(false);
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        setPesanan([]);
        setGalat(e instanceof Error ? e.message : "Gagal memuat jadwal");
        setMemuat(false);
      });

    return () => ctrl.abort();
  }, [bulan, percobaan]);

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

  // Setelah data bulan selesai dimuat: gulir ke kolom hari terpilih &
  // acara pertamanya
  useEffect(() => {
    if (memuat || !bulan) return;
    const el = scroller.current;
    if (!el) return;
    const kolom = el.querySelector<HTMLElement>(`[data-day="${selected}"]`);
    const jadwal = perHari.get(selected)?.terjadwal ?? [];
    const awal = jadwal.length ? jadwal[0].start : START_HOUR + 1;
    el.scrollTo({
      left: Math.max(0, (kolom?.offsetLeft ?? 0) - TIME_COL),
      top: Math.max(0, (awal - START_HOUR - 0.5) * ROW_H),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memuat]);

  // Bulan ini → langsung ke hari ini; bulan lain → tanggal 1
  const gantiBulan = (ym: string) => {
    setBulan(ym);
    setSelected(ym === bulanIni ? hariIni : `${ym}-01`);
  };

  return (
    <AppShell active="jadwal">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm">
            <CalendarDays className="size-4 text-neutral-400" /> Jadwal Acara
          </span>
          <span className={label}>
            {memuat
              ? "Memuat…"
              : `${jumlahAcara} Acara ${
                  bulan === bulanIni ? "Bulan Ini" : `di ${namaBulan(bulan)}`
                }`}
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
              {opsiBulan.map((b) => (
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
          <section className={`${card} relative h-full overflow-hidden`}>
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
                              key === hariIni
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
                        {(perHari.get(key)?.tanpaJam ?? []).map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSel(p)}
                            title={`${namaTampil(p)} · ${p.item}`}
                            className={`flex items-center gap-1.5 rounded-md bg-white/[0.06] px-1.5 py-1 text-left text-[11px] text-neutral-200 transition-colors hover:bg-white/10 ${
                              p.status === "Batal" ? "opacity-50" : ""
                            }`}
                          >
                            <Avatar nama={p.customer} kecil />
                            <span className="truncate">
                              <span
                                className={
                                  adaNama(p) ? "" : "italic text-neutral-400"
                                }
                              >
                                {namaTampil(p)}
                              </span>
                              <span className="text-neutral-500">
                                {" "}
                                · {p.item}
                              </span>
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
                    const ditata = tataHari(perHari.get(key)?.terjadwal ?? []);
                    const tampilGaris =
                      key === hariIni &&
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

            {/* Status pengambilan data */}
            {memuat && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#1b1b1b] px-3 py-1.5 text-xs text-neutral-300">
                <Loader2 className="size-3.5 animate-spin" />
                Memuat jadwal…
              </div>
            )}
            {galat && !memuat && (
              <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-red-500/30 bg-[#1b1b1b] px-4 py-2.5 text-sm text-red-300">
                <span>{galat}</span>
                <button
                  onClick={() => setPercobaan((n) => n + 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-neutral-200 transition-colors hover:bg-white/5"
                >
                  <RefreshCw className="size-3.5" />
                  Coba lagi
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {sel && <DetailPesanan order={sel} onClose={() => setSel(null)} />}
    </AppShell>
  );
}
