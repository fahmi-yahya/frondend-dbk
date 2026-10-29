"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Printer, X } from "lucide-react";
import {
  AreaCetak,
  RingkasanPesanan,
  tanggalLengkap,
  type DataRingkasan,
} from "@/components/RingkasanPesanan";

/*
  Tipe pesanan + detail pesanan (popup) yang dipakai bersama.
  Isinya sama persis dengan yang ada di halaman Dashboard, jadi kalau mau,
  Dashboard bisa import dari sini dan menghapus salinannya sendiri.
*/

// Data tambahan yang muncul di detail pesanan (semuanya boleh dikosongkan;
// bagian yang kosong otomatis disembunyikan di detail)
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

// Ubah satu pesanan menjadi data untuk ringkasan / detail pesanan
export const detailDari = (od: Order): DataRingkasan => {
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

const label = "font-mono text-xs text-[var(--text-muted)]";

/* ------------------------------------------------------------------ */
/* Detail pesanan (muncul saat pesanan diklik)                          */
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
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-base)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <p className="text-sm" style={{ color: "var(--text-base)" }}>
                  Detail Pesanan
                </p>
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
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-muted)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <Printer className="size-3.5" /> Cetak
                </button>
                <button
                  onClick={onClose}
                  autoFocus
                  aria-label="Tutup"
                  className="grid size-8 place-items-center rounded-lg border transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--text-base)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div
              className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6"
              style={{ background: "var(--bg-surface2)" }}
            >
              <div
                className="rounded-xl p-6 shadow-sm sm:p-8"
                style={{ background: "#fff" }}
              >
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
