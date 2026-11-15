/* eslint-disable @next/next/no-img-element */
"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

// Identitas usaha yang tampil di ringkasan / hasil cetak
export const usaha = { nama: "DBK", alamat: "Jl. Contoh No. 1" };

/* ------------------------------------------------------------------ */
/* Format tanggal                                                      */
/* Input: "2026-09-30" (sama seperti <input type="date">)             */
/* ------------------------------------------------------------------ */

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = [
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

const pecah = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d, dd: String(d).padStart(2, "0") };
};

/** "Rabu" */
export const hariDari = (iso: string) => {
  if (!iso) return "";
  const { y, m, d } = pecah(iso);
  return HARI[new Date(y, m - 1, d).getDay()];
};

/** "30 September 2026" */
export const tanggalPanjang = (iso: string) => {
  if (!iso) return "";
  const { y, m, dd } = pecah(iso);
  return `${dd} ${BULAN[m - 1]} ${y}`;
};

/** "30 Sep 2026" */
export const tanggalSingkat = (iso: string) => {
  if (!iso) return "";
  const { y, m, dd } = pecah(iso);
  return `${dd} ${BULAN[m - 1].slice(0, 3)} ${y}`;
};

/** "Rabu, 30 September 2026" */
export const tanggalLengkap = (iso: string) =>
  iso ? `${hariDari(iso)}, ${tanggalPanjang(iso)}` : "";

/* ------------------------------------------------------------------ */
/* Data ringkasan                                                      */
/* ------------------------------------------------------------------ */

export type Pasang = { label: string; nilai: string };
export type DataRingkasan = {
  noPesanan: string;
  tanggal: string;
  jam: string;
  nama: string;
  hp: string;
  lokasi: string;
  gps: string;
  menu: Pasang[];
  jumlah: string;
  kebutuhan: Pasang[];
  bonus: string[];
  keterangan: string;
};

/* ------------------------------------------------------------------ */
/* Susunan bagian (dipakai bersama oleh preview, cetak, dan file PDF,   */
/* supaya isi ketiganya selalu sama)                                    */
/* ------------------------------------------------------------------ */

export type Baris = {
  label: string;
  nilai: string;
  // isi : daftar hidangan (dipisah baris baru), tampil berkolom
  // peta: link Google Maps
  // sorot: baris penting
  // kolom: beberapa isian berdampingan dalam satu baris (isinya di `kolom`)
  tipe?: "isi" | "peta" | "sorot" | "kolom";
  kolom?: Pasang[];
};
export type Bagian = {
  judul: string;
  baris: Baris[];
  catatan?: string; // hanya untuk bagian "Catatan"
  penutup?: boolean; // true = bagian "Catatan"
};

// Isian yang digabung ke satu baris berkolom bersama Jumlah Pesanan
const DI_KOLOM = ["Jumlah Meja", "Warna Taplak"];
// Isian yang disembunyikan selama belum diisi (di form, cetak, maupun PDF)
const OPSIONAL = ["Waiters"];

export const KALIMAT_PENUTUP =
  "Terima kasih atas pesanan Anda! Kami siap melayani acara Anda.";

/**
 * sembunyikanKosong = true: baris dan bagian yang kosong dibuang
 * (cetak / PDF / detail pesanan). false: baris kosong tampil "-"
 * (form pesanan baru).
 */
export function bagianDari(
  d: DataRingkasan,
  sembunyikanKosong: boolean,
): Bagian[] {
  const peta = d.gps.startsWith("http") ? d.gps : "";
  const ada = (b: Baris) =>
    b.tipe === "kolom"
      ? (b.kolom ?? []).some((k) => k.nilai !== "")
      : b.nilai !== "";
  const pilih = (daftar: Baris[]) =>
    daftar
      .filter((b) => !sembunyikanKosong || ada(b))
      .map((b) =>
        sembunyikanKosong && b.tipe === "kolom"
          ? { ...b, kolom: (b.kolom ?? []).filter((k) => k.nilai !== "") }
          : b,
      );
  const kebutuhan = (label: string) =>
    d.kebutuhan.find((k) => k.label === label)?.nilai ?? "";

  const semua: Bagian[] = [
    {
      judul: "Pemesan",
      baris: [
        { label: "Nama", nilai: d.nama },
        { label: "No. HP", nilai: d.hp },
      ],
    },
    {
      judul: "Acara",
      baris: [
        { label: "Hari / Tanggal", nilai: d.tanggal },
        { label: "Jam Acara", nilai: d.jam },
        { label: "Lokasi", nilai: d.lokasi },
        { label: "Peta", nilai: peta, tipe: "peta" },
      ],
    },
    {
      judul: "Menu Pesanan",
      baris: d.menu.map((m) => ({
        label: m.label,
        nilai: m.nilai,
        tipe: m.label === "Isi Paket" ? ("isi" as const) : undefined,
      })),
    },
    {
      judul: "Kebutuhan Acara",
      baris: [
        {
          label: "Rincian",
          nilai: "",
          tipe: "kolom",
          kolom: [
            { label: "Jumlah Pesanan", nilai: d.jumlah },
            { label: "Jumlah Meja", nilai: kebutuhan("Jumlah Meja") },
            { label: "Warna Taplak", nilai: kebutuhan("Warna Taplak") },
          ],
        },
        ...d.kebutuhan.filter(
          (k) =>
            !DI_KOLOM.includes(k.label) &&
            !(OPSIONAL.includes(k.label) && k.nilai === ""),
        ),
        { label: "Bonus", nilai: d.bonus.join(", ") },
      ],
    },
  ];

  return [
    ...semua
      .map((b) => ({ ...b, baris: pilih(b.baris) }))
      .filter((b) => b.baris.length > 0),
    { judul: "Catatan", baris: [], catatan: d.keterangan, penutup: true },
  ];
}

/* ------------------------------------------------------------------ */
/* Ringkasan pesanan (tampilan layar)                                   */
/* ------------------------------------------------------------------ */

// Tanda "-" untuk data yang belum diisi (hanya tampil di layar)
const strip = <span className="text-neutral-300">-</span>;

/**
 * cetak            : versi kertas (bagian kosong disembunyikan, link peta
 *                    ditulis lengkap, jarak dirapatkan)
 * sembunyikanKosong: sembunyikan bagian kosong tapi tetap tampil di layar
 *                    (cocok untuk detail pesanan yang sudah tersimpan)
 * Tanpa keduanya, bagian kosong tampil "-" (cocok untuk form pesanan baru).
 */
export function RingkasanPesanan({
  data: d,
  cetak = false,
  sembunyikanKosong = false,
}: {
  data: DataRingkasan;
  cetak?: boolean;
  sembunyikanKosong?: boolean;
}) {
  const sembunyi = cetak || sembunyikanKosong;
  const bagian = bagianDari(d, sembunyi);
  const py = cetak ? "py-1.5" : "py-2.5";

  return (
    <article className="text-base leading-relaxed text-neutral-900">
      {/* Kepala: logo + nomor pesanan */}
      <header className="flex items-start justify-between gap-4">
        <img
          src="/logo-dbk.png"
          alt="DBK Catering Service"
          loading="eager"
          className="h-14 w-auto"
        />
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Ringkasan Pesanan
          </p>
          <p className="mt-1 inline-block rounded-md border border-neutral-300 px-2.5 py-1 font-mono text-base">
            {d.noPesanan}
          </p>
        </div>
      </header>

      {/* Bagian-bagian berbingkai, diberi nomor supaya mudah dibaca urut */}
      <div className={`${cetak ? "mt-4 space-y-2.5" : "mt-5 space-y-3"}`}>
        {bagian.map((b, i) => (
          <section
            key={b.judul}
            className="break-inside-avoid overflow-hidden rounded-lg border border-neutral-300"
          >
            <h3 className="flex items-center gap-2 border-b border-neutral-300 bg-neutral-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-700">
              <span className="grid size-6 place-items-center rounded-full bg-neutral-900 text-xs font-semibold leading-none text-white">
                {i + 1}
              </span>
              {b.judul}
            </h3>

            {b.penutup ? (
              <div className={`px-3 ${py}`}>
                {b.catatan ? (
                  <p className="whitespace-pre-line break-words">{b.catatan}</p>
                ) : (
                  !sembunyi && <p>{strip}</p>
                )}
                <p
                  className={`text-neutral-600 ${b.catatan || !sembunyi ? "mt-1.5" : ""}`}
                >
                  {KALIMAT_PENUTUP}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {b.baris.map((r) =>
                  r.tipe === "kolom" ? (
                    <div
                      key={r.label}
                      className="grid divide-x divide-neutral-200 bg-neutral-50"
                      style={{
                        gridTemplateColumns: `repeat(${r.kolom?.length || 1}, minmax(0, 1fr))`,
                      }}
                    >
                      {r.kolom?.map((k) => (
                        <div key={k.label} className={`min-w-0 px-3 ${py}`}>
                          <p className="text-sm text-neutral-500">{k.label}</p>
                          <p
                            className={`mt-0.5 break-words font-semibold leading-snug ${cetak ? "text-base" : "text-lg"}`}
                          >
                            {k.nilai || strip}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : r.tipe === "isi" ? (
                    <div key={r.label} className={`px-3 ${py}`}>
                      <p className="text-sm text-neutral-500">{r.label}</p>
                      {r.nilai ? (
                        <ul
                          className={`mt-1.5 gap-x-6 ${cetak ? "columns-3" : "columns-2"}`}
                        >
                          {r.nilai
                            .split("\n")
                            .filter(Boolean)
                            .map((x, j) => (
                              <li
                                key={`${x}-${j}`}
                                className="flex break-inside-avoid gap-2 break-words"
                              >
                                <span className="text-neutral-400">•</span>
                                {x}
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <p className="mt-1">{strip}</p>
                      )}
                    </div>
                  ) : (
                    <div
                      key={r.label}
                      className={`grid grid-cols-[36%_1fr] gap-3 px-3 ${py} ${
                        r.tipe === "sorot" ? "bg-neutral-50" : ""
                      }`}
                    >
                      <p className="text-neutral-500">{r.label}</p>
                      <p
                        className={`min-w-0 whitespace-pre-line break-words ${
                          r.tipe === "sorot" ? "font-semibold" : ""
                        }`}
                      >
                        {!r.nilai ? (
                          strip
                        ) : r.tipe === "peta" ? (
                          cetak ? (
                            <span className="break-all">{r.nilai}</span>
                          ) : (
                            <a
                              href={r.nilai}
                              target="_blank"
                              rel="noreferrer"
                              className="text-orange-600 underline"
                            >
                              Buka peta
                            </a>
                          )
                        ) : (
                          r.nilai
                        )}
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Area cetak                                                          */
/*                                                                     */
/* Dipasang langsung di <body> lewat portal, supaya hasil cetak tidak   */
/* terpengaruh sidebar / layout AppShell. Di layar area ini tersembunyi.*/
/* Pasang <AreaCetak data={...} /> di halaman yang punya tombol Cetak.  */
/* ------------------------------------------------------------------ */

const subscribeKosong = () => () => {};

// Saat mencetak: sembunyikan semua elemen kecuali #area-cetak, kertas A4.
// print-color-adjust supaya latar abu-abu ikut tercetak.
// Teks dirapatkan sedikit supaya ringkasan muat satu lembar.
const cssCetak = `
@page { size: A4; margin: 14mm; }
@media print {
  html, body { background: #fff !important; }
  body > *:not(#area-cetak) { display: none !important; }
  #area-cetak, #area-cetak * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  #area-cetak article { font-size: 14px; line-height: 1.45; }
}
`;

export function AreaCetak({ data }: { data: DataRingkasan }) {
  const siap = useSyncExternalStore(
    subscribeKosong,
    () => true,
    () => false,
  );
  if (!siap) return null;
  return (
    <>
      <style>{cssCetak}</style>
      {createPortal(
        <div id="area-cetak" className="hidden print:block">
          <RingkasanPesanan data={data} cetak />
        </div>,
        document.body,
      )}
    </>
  );
}
