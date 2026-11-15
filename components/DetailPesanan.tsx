"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, X } from "lucide-react";
import {
  AreaCetak,
  RingkasanPesanan,
  tanggalLengkap,
  type DataRingkasan,
  type Pasang,
} from "@/components/RingkasanPesanan";
import { api } from "@/lib/api";
import { rupiah } from "@/data/menu";

/*
  Tipe pesanan + detail pesanan (popup) yang dipakai bersama.
  Isinya sama persis dengan yang ada di halaman Dashboard, jadi kalau mau,
  Dashboard bisa import dari sini dan menghapus salinannya sendiri.
*/

// Data tambahan yang muncul di detail pesanan (semuanya boleh dikosongkan)
export type Extra = {
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

export type Order = {
  id: string;
  customer: string;
  item: string; // contoh: "Nasi Box ×80" (nama paket ×jumlah)
  tanggal: string; // format "2026-03-19"
  lokasi: string;
  amount: number;
  status: "Lunas" | "DP" | "Batal";
  extra: Extra;
};

export const o = (
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

export const statusStyle: Record<Order["status"], string> = {
  Lunas: "bg-green-500/15 text-green-600 dark:text-green-400",
  DP: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Batal: "bg-red-500/15 text-red-600 dark:text-red-400",
};

/* ------------------------------------------------------------------ */
/* Nama & no. HP pemesan                                                */
/*                                                                     */
/* API Laravel bisa mengirim nama pemesan dengan kunci yang berbeda     */
/* (customer / nama / nama_pelanggan / pelanggan: { nama } ...), atau   */
/* kosong. Dua fungsi ini mencoba semua kemungkinan itu supaya nama     */
/* tetap tampil di detail pesanan, jadwal, dan dashboard.               */
/* ------------------------------------------------------------------ */

type Rekaman = Record<string, unknown>;

const teks = (v: unknown): string =>
  typeof v === "string" || typeof v === "number" ? String(v).trim() : "";

// Ambil nilai teks pertama yang terisi dari daftar kunci
const dariKunci = (sumber: unknown, kunci: string[]): string => {
  if (!sumber || typeof sumber !== "object") return "";
  const r = sumber as Rekaman;
  for (const k of kunci) {
    const t = teks(r[k]);
    if (t) return t;
  }
  return "";
};

const KUNCI_NAMA = [
  "customer",
  "nama",
  "nama_pelanggan",
  "nama_pemesan",
  "pemesan",
  "pelanggan",
  "name",
];
const KUNCI_NAMA_DALAM = ["nama", "nama_pelanggan", "nama_pemesan", "name"];
const KUNCI_HP = ["hp", "no_hp", "nomor_hp", "telepon", "phone"];

export const namaPemesan = (od: Order): string => {
  const r = od as unknown as Rekaman;
  return (
    dariKunci(r, KUNCI_NAMA) ||
    // bentuk bersarang: customer: { nama }, pelanggan: { nama_pelanggan }
    dariKunci(r.customer, KUNCI_NAMA_DALAM) ||
    dariKunci(r.pelanggan, KUNCI_NAMA_DALAM) ||
    dariKunci(r.pemesan, KUNCI_NAMA_DALAM) ||
    dariKunci(od.extra, KUNCI_NAMA)
  );
};

export const hpPemesan = (od: Order): string => {
  const r = od as unknown as Rekaman;
  return (
    dariKunci(od.extra, KUNCI_HP) ||
    dariKunci(r, KUNCI_HP) ||
    dariKunci(r.customer, KUNCI_HP) ||
    dariKunci(r.pelanggan, KUNCI_HP) ||
    dariKunci(r.pemesan, KUNCI_HP)
  );
};

/* ------------------------------------------------------------------ */
/* Paket + isinya                                                       */
/*                                                                     */
/* Isi paket (daftar hidangan) tidak ikut di data pesanan, jadi diambil */
/* dari GET /paket, sama seperti di form Pesanan Baru. Hasilnya        */
/* disimpan, jadi popup berikutnya langsung tampil tanpa menunggu.      */
/* ------------------------------------------------------------------ */

type PaketInfo = { nama: string; harga: number; isi: string[] };

let paketTersimpan: PaketInfo[] | null = null;
let paketDimuat: Promise<PaketInfo[]> | null = null;

// "25000", "25.000", atau "25000.00" -> 25000
const angka = (v: unknown) =>
  parseInt(
    String(v ?? "")
      .replace(/[.,]\d{1,2}$/, "")
      .replace(/\D/g, ""),
    10,
  ) || 0;

// Laravel memberi nama relasi apa adanya (menu / menus / ...), jadi dicoba semua
const ambilIsi = (p: Rekaman): string[] => {
  const sumber = p.menu ?? p.menus ?? p.daftar_menu ?? p.isi ?? [];
  if (!Array.isArray(sumber)) return [];
  return sumber
    .map((m) => (typeof m === "string" ? m : teks((m as Rekaman)?.nama_menu)))
    .filter(Boolean);
};

function muatPaket(): Promise<PaketInfo[]> {
  if (paketTersimpan) return Promise.resolve(paketTersimpan);
  if (paketDimuat) return paketDimuat;

  const janji: Promise<PaketInfo[]> = api
    .get("/paket")
    .then((res) => {
      const list = (Array.isArray(res.data) ? res.data : res.data?.data) ?? [];
      const hasil: PaketInfo[] = (list as Rekaman[]).map((p) => ({
        nama: teks(p.nama_paket),
        harga: angka(p.harga_paket),
        isi: ambilIsi(p),
      }));
      paketTersimpan = hasil;
      return hasil;
    })
    .catch(() => {
      paketDimuat = null; // gagal: coba lagi saat popup berikutnya dibuka
      return [] as PaketInfo[];
    });
  paketDimuat = janji;
  return janji;
}

// Item "Bakso / Sup Kimlo" = pelanggan memilih salah satu. Yang tersimpan
// hanya pilihan sup dan es, jadi item itu diganti dengan pilihan tersebut.
const opsi = (x: string) => x.split(/\s*\/\s*/).filter(Boolean);
const isiTerpilih = (isi: string[], x: Extra) => {
  const dipilih = [x.sup, x.es]
    .map((v) => (v ?? "").trim().toLowerCase())
    .filter(Boolean);
  return isi.map((item) => {
    const o = opsi(item);
    if (o.length < 2) return item;
    return o.find((v) => dipilih.includes(v.toLowerCase())) ?? item;
  });
};

// Ubah satu pesanan menjadi data untuk ringkasan / detail pesanan.
// `paket` (opsional) dipakai untuk menampilkan harga per porsi + isi paket,
// sama seperti Preview di halaman Pesanan Baru.
export const detailDari = (od: Order, paket?: PaketInfo): DataRingkasan => {
  const [namaPaket, qty = ""] = od.item.split(" ×");
  const x = od.extra ?? {};

  // Harga per porsi dihitung dari total pesanan (harga saat dipesan);
  // kalau tidak bisa, pakai harga paket sekarang.
  const jumlah = Number(qty.replace(/\D/g, "")) || 0;
  const total = Number(od.amount) || 0;
  const harga =
    jumlah > 0 && total > 0 ? Math.round(total / jumlah) : (paket?.harga ?? 0);
  const labelPaket =
    harga > 0 ? `${namaPaket} — ${rupiah(harga)} / porsi` : namaPaket;

  const menu: Pasang[] = paket?.isi.length
    ? [
        { label: "Paket", nilai: labelPaket },
        { label: "Isi Paket", nilai: isiTerpilih(paket.isi, x).join("\n") },
        { label: "Data Tambahan", nilai: x.dataTambahan ?? "" },
      ]
    : [
        // Isi paket belum ada (belum selesai dimuat / paket tidak ditemukan)
        { label: "Paket", nilai: labelPaket },
        ...(x.sup ? [{ label: "Pilihan Sup", nilai: x.sup }] : []),
        ...(x.es ? [{ label: "Pilihan Es", nilai: x.es }] : []),
        { label: "Data Tambahan", nilai: x.dataTambahan ?? "" },
      ];

  return {
    noPesanan: od.id,
    tanggal: tanggalLengkap(od.tanggal),
    jam: x.jam ?? "",
    nama: namaPemesan(od),
    hp: hpPemesan(od),
    lokasi: od.lokasi,
    gps: x.gps ?? "",
    menu,
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

// Warna status untuk latar putih (statusStyle di atas untuk tampilan gelap)
const statusTerang: Record<Order["status"], string> = {
  Lunas: "bg-green-100 text-green-700",
  DP: "bg-amber-100 text-amber-700",
  Batal: "bg-red-100 text-red-700",
};

/* ------------------------------------------------------------------ */
/* Detail pesanan (muncul saat pesanan diklik)                          */
/*                                                                     */
/* Tampilannya sama dengan Preview di halaman Pesanan Baru: panel      */
/* putih, judul di atas, lalu isi di atas latar abu-abu muda.           */
/* ------------------------------------------------------------------ */

export function DetailPesanan({
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

  // Isi paket diambil dari /paket (disimpan, jadi cepat di popup berikutnya)
  const [daftarPaket, setDaftarPaket] = useState<PaketInfo[]>(
    paketTersimpan ?? [],
  );
  useEffect(() => {
    let batal = false;
    muatPaket().then((d) => {
      if (!batal) setDaftarPaket(d);
    });
    return () => {
      batal = true;
    };
  }, []);

  const namaPaket = order.item.split(" ×")[0].trim().toLowerCase();
  const paket = daftarPaket.find(
    (p) => p.nama.trim().toLowerCase() === namaPaket,
  );
  const data = detailDari(order, paket);

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
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-5 py-3.5">
              <h2 className="text-sm font-medium text-neutral-900">
                Detail Pesanan
              </h2>
              <div className="flex shrink-0 items-center gap-2">
                <span className="mr-1 hidden font-mono text-xs text-neutral-500 sm:inline">
                  Total Rp {Number(order.amount || 0).toLocaleString("id-ID")}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${statusTerang[order.status] ?? ""}`}
                >
                  {order.status}
                </span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-100"
                >
                  <Printer className="size-3.5" /> Cetak
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  autoFocus
                  aria-label="Tutup"
                  className="grid size-8 place-items-center rounded-lg border border-neutral-300 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain bg-neutral-100 p-4 sm:p-6">
              <div className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
                <RingkasanPesanan data={data} />
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
