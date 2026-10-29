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
/* Ringkasan pesanan                                                   */
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

// Tanda "-" untuk data yang belum diisi (hanya tampil di layar)
const strip = <span className="text-neutral-300">-</span>;
const nilai = (v: string) => (v ? v : strip);

// Label kecil abu-abu di atas, nilai di bawahnya
function Rincian({
  label,
  children,
  kanan = false,
}: {
  label: string;
  children: React.ReactNode;
  kanan?: boolean;
}) {
  return (
    <div className={kanan ? "text-right" : ""}>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 break-words">{children}</p>
    </div>
  );
}

/**
 * cetak            : versi kertas (bagian kosong disembunyikan, link peta
 *                    ditulis lengkap)
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
  const ada = (v: string) => !sembunyi || v !== "";

  const peta = d.gps.startsWith("http") ? d.gps : "";
  const bonus = d.bonus.join(", ");
  const menu = d.menu.filter((m) => ada(m.nilai));
  const kebutuhan = d.kebutuhan.filter((k) => ada(k.nilai));
  const adaKotak = kebutuhan.length > 0 || ada(d.jumlah);
  const adaKiri = ada(d.lokasi) || ada(peta) || ada(bonus);

  return (
    <article className="text-sm leading-relaxed text-neutral-900">
      {/* Logo */}
      <img
        src="/logo-dbk.png"
        alt="DBK Catering Service"
        loading="eager"
        className="h-14 w-auto"
      />

      {/* Info utama */}
      <div className="mt-6 flex flex-wrap justify-between gap-x-6 gap-y-3">
        {ada(d.tanggal) && (
          <Rincian label="Hari / Tanggal">{nilai(d.tanggal)}</Rincian>
        )}
        {ada(d.jam) && <Rincian label="Jam Acara">{nilai(d.jam)}</Rincian>}
        <Rincian label="No. Pesanan" kanan>
          <span className="font-mono">{d.noPesanan}</span>
        </Rincian>
      </div>

      {/* Dari */}
      <div className="mt-6">
        <p className="text-xs text-neutral-500">Dari:</p>
        <p className="mt-1.5 text-base font-medium">{usaha.nama}</p>
        <p className="text-xs text-neutral-500">{usaha.alamat}</p>
      </div>

      {/* Untuk */}
      {(ada(d.nama) || ada(d.hp)) && (
        <div className="mt-5">
          <p className="text-xs text-neutral-500">Untuk:</p>
          <p className="mt-1.5 break-words text-base font-medium">
            {nilai(d.nama)}
          </p>
          {ada(d.hp) && (
            <p className="text-xs text-neutral-500">{d.hp || "-"}</p>
          )}
        </div>
      )}

      {/* Tabel menu */}
      {menu.length > 0 && (
        <table className="mt-6 w-full table-fixed border-collapse">
          <thead>
            <tr>
              <th className="w-2/5 rounded-l-lg bg-neutral-50 px-3 py-2.5 text-left font-normal text-neutral-600">
                Item
              </th>
              <th className="rounded-r-lg bg-neutral-50 px-3 py-2.5 text-left font-normal text-neutral-600">
                Pilihan
              </th>
            </tr>
          </thead>
          <tbody>
            {menu.map((m) => (
              <tr key={m.label} className="break-inside-avoid">
                <td className="border-b border-neutral-100 px-3 py-3 align-top text-neutral-600">
                  {m.label}
                </td>
                <td className="whitespace-pre-line break-words border-b border-neutral-100 px-3 py-3 align-top">
                  {nilai(m.nilai)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Lokasi & kebutuhan acara */}
      {(adaKiri || adaKotak) && (
        <div className="mt-6 grid grid-cols-2 items-start gap-6 break-inside-avoid">
          <div className="min-w-0 space-y-4">
            {ada(d.lokasi) && (
              <Rincian label="Lokasi Acara">{nilai(d.lokasi)}</Rincian>
            )}
            {ada(peta) && (
              <Rincian label="Peta">
                {peta ? (
                  cetak ? (
                    <span className="break-all">{peta}</span>
                  ) : (
                    <a
                      href={peta}
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-600 underline"
                    >
                      Buka peta
                    </a>
                  )
                ) : (
                  strip
                )}
              </Rincian>
            )}
            {ada(bonus) && <Rincian label="Bonus">{nilai(bonus)}</Rincian>}
          </div>

          {adaKotak && (
            <div className="col-start-2 overflow-hidden rounded-xl border border-neutral-200">
              {kebutuhan.map((k) => (
                <div
                  key={k.label}
                  className="flex justify-between gap-3 px-4 py-2.5"
                >
                  <span className="text-neutral-500">{k.label}</span>
                  <span className="min-w-0 break-words text-right">
                    {nilai(k.nilai)}
                  </span>
                </div>
              ))}
              {ada(d.jumlah) && (
                <div className="flex justify-between gap-3 bg-neutral-50 px-4 py-3 font-medium">
                  <span>Jumlah Pesanan</span>
                  <span className="min-w-0 break-words text-right">
                    {nilai(d.jumlah)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Catatan */}
      <div className="mt-6">
        <p className="text-xs text-neutral-500">Catatan</p>
        {ada(d.keterangan) && (
          <p className="mt-1 whitespace-pre-line break-words">
            {nilai(d.keterangan)}
          </p>
        )}
        <p className="mt-2 text-neutral-600">
          Terima kasih atas pesanan Anda! Kami siap melayani acara Anda.
        </p>
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
// print-color-adjust supaya kotak gelap (logo) & latar abu-abu ikut tercetak.
const cssCetak = `
@page { size: A4; margin: 14mm; }
@media print {
  html, body { background: #fff !important; }
  body > *:not(#area-cetak) { display: none !important; }
  #area-cetak, #area-cetak * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
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
