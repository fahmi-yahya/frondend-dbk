"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import {
  Bell,
  ChefHat,
  Cone,
  Cookie,
  Package,
  Search,
  Utensils,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Data contoh                                                         */
/*                                                                     */
/* Harga paket diturunkan dari total pesanan di data contoh Jadwal     */
/* Acara (mis. Nasi Box ×100 = Rp 2.500.000, Prasmanan ×150 =          */
/* Rp 11.250.000), supaya angkanya konsisten. Minimum order dan isi    */
/* menu hanya contoh. Ganti dengan sumber data asli kalau sudah ada.   */
/*                                                                     */
/* Satu menu bisa dipakai di beberapa paket (field `paket`). Tab Paket */
/* menyusun isinya dari daftar menu, jadi menandai menu "Habis" juga   */
/* tampil di kartu paket yang memakainya.                              */
/* ------------------------------------------------------------------ */

const KATEGORI = ["Nasi", "Lauk", "Sayur", "Sup", "Es", "Snack"] as const;
type Kategori = (typeof KATEGORI)[number];

type Menu = { id: string; nama: string; kategori: Kategori; paket: string[] };

const menu: Menu[] = [
  {
    id: "nasi-putih",
    nama: "Nasi Putih",
    kategori: "Nasi",
    paket: ["nasi-box", "prasmanan"],
  },
  {
    id: "nasi-kuning",
    nama: "Nasi Kuning",
    kategori: "Nasi",
    paket: ["tumpeng", "tumpeng-mini"],
  },

  {
    id: "ayam-goreng",
    nama: "Ayam Goreng",
    kategori: "Lauk",
    paket: ["nasi-box", "prasmanan", "tumpeng"],
  },
  {
    id: "ayam-bakar",
    nama: "Ayam Bakar",
    kategori: "Lauk",
    paket: ["nasi-box", "prasmanan"],
  },
  {
    id: "rendang",
    nama: "Rendang Sapi",
    kategori: "Lauk",
    paket: ["prasmanan"],
  },
  {
    id: "ikan-goreng",
    nama: "Ikan Goreng",
    kategori: "Lauk",
    paket: ["prasmanan", "tumpeng"],
  },
  {
    id: "telur-balado",
    nama: "Telur Balado",
    kategori: "Lauk",
    paket: ["nasi-box", "tumpeng-mini"],
  },
  {
    id: "tempe-orek",
    nama: "Tempe Orek",
    kategori: "Lauk",
    paket: ["nasi-box", "tumpeng", "tumpeng-mini"],
  },
  {
    id: "perkedel",
    nama: "Perkedel Kentang",
    kategori: "Lauk",
    paket: ["tumpeng", "tumpeng-mini"],
  },

  {
    id: "sambal-goreng",
    nama: "Sambal Goreng Kentang",
    kategori: "Sayur",
    paket: ["nasi-box", "prasmanan"],
  },
  { id: "capcay", nama: "Capcay", kategori: "Sayur", paket: ["prasmanan"] },
  {
    id: "urap",
    nama: "Urap Sayur",
    kategori: "Sayur",
    paket: ["tumpeng", "tumpeng-mini"],
  },

  { id: "bakso", nama: "Bakso", kategori: "Sup", paket: ["prasmanan"] },
  { id: "kimlo", nama: "Kimlo", kategori: "Sup", paket: ["prasmanan"] },
  { id: "soto-ayam", nama: "Soto Ayam", kategori: "Sup", paket: ["prasmanan"] },

  { id: "es-buah", nama: "Es Buah", kategori: "Es", paket: ["prasmanan"] },
  { id: "es-campur", nama: "Es Campur", kategori: "Es", paket: ["prasmanan"] },

  { id: "risoles", nama: "Risoles", kategori: "Snack", paket: ["snack-box"] },
  { id: "lemper", nama: "Lemper", kategori: "Snack", paket: ["snack-box"] },
  {
    id: "kue-lapis",
    nama: "Kue Lapis",
    kategori: "Snack",
    paket: ["snack-box"],
  },
  { id: "pastel", nama: "Pastel", kategori: "Snack", paket: ["snack-box"] },
  {
    id: "dadar-gulung",
    nama: "Dadar Gulung",
    kategori: "Snack",
    paket: ["snack-box"],
  },
  {
    id: "arem-arem",
    nama: "Arem-arem",
    kategori: "Snack",
    paket: ["snack-box"],
  },
];

type Paket = {
  id: string;
  nama: string;
  ikon: LucideIcon;
  satuan: string;
  harga: number;
  /** Harga turun mulai jumlah tertentu */
  hargaGrosir?: { mulai: number; harga: number };
  minOrder: number;
  deskripsi: string;
  /** Kategori yang dipilih pelanggan, dan berapa pilihannya */
  pilih?: Partial<Record<Kategori, number>>;
  bonus?: string[];
};

const paket: Paket[] = [
  {
    id: "nasi-box",
    nama: "Nasi Box",
    ikon: Package,
    satuan: "box",
    harga: 25000,
    minOrder: 30,
    deskripsi:
      "Nasi lengkap dalam kotak. Cocok untuk rapat, pelatihan, dan acara kantor atau sekolah.",
  },
  {
    id: "snack-box",
    nama: "Snack Box",
    ikon: Cookie,
    satuan: "box",
    harga: 25000,
    minOrder: 40,
    deskripsi:
      "Aneka kue basah dalam kotak untuk rapat, arisan, dan pengajian.",
    pilih: { Snack: 3 },
  },
  {
    id: "tumpeng",
    nama: "Tumpeng",
    ikon: Cone,
    satuan: "tumpeng",
    harga: 450000,
    minOrder: 1,
    deskripsi:
      "Tumpeng nasi kuning dengan lauk lengkap untuk syukuran dan peringatan.",
  },
  {
    id: "tumpeng-mini",
    nama: "Tumpeng Mini",
    ikon: Cone,
    satuan: "tumpeng",
    harga: 425000,
    minOrder: 1,
    deskripsi: "Ukuran lebih kecil untuk syukuran keluarga.",
  },
  {
    id: "prasmanan",
    nama: "Prasmanan",
    ikon: Utensils,
    satuan: "porsi",
    harga: 95000,
    hargaGrosir: { mulai: 150, harga: 75000 },
    minOrder: 30,
    deskripsi:
      "Hidangan prasmanan lengkap untuk hajatan dan resepsi. Jumlah meja, warna taplak, dan pramusaji diatur saat membuat pesanan.",
    pilih: { Sup: 1, Es: 1 },
    bonus: ["Dekorasi meja", "Air mineral", "Dekorasi pelaminan"],
  },
];

const card = "rounded-2xl border border-white/10 bg-[#141414]";
const label = "font-mono text-xs text-neutral-400";
const chip = "rounded-md bg-white/[0.06] px-2 py-1 text-xs";

const rupiah = (n: number) =>
  `Rp ${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
const namaPaket = (id: string) => paket.find((p) => p.id === id)?.nama ?? id;
const menuDalam = (idPaket: string) =>
  menu.filter((m) => m.paket.includes(idPaket));

/* ------------------------------------------------------------------ */
/* Komponen kecil                                                      */
/* ------------------------------------------------------------------ */

function KartuPaket({ p, habis }: { p: Paket; habis: Set<string> }) {
  const Ikon = p.ikon;
  const isi = menuDalam(p.id);
  const kelompok = KATEGORI.map((k) => ({
    k,
    items: isi.filter((m) => m.kategori === k),
  })).filter((g) => g.items.length > 0);
  const jumlahHabis = isi.filter((m) => habis.has(m.id)).length;

  return (
    <article className={`${card} flex flex-col gap-4 p-5`}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 text-orange-500">
            <Ikon className="size-5" />
          </span>
          <div>
            <h3 className="text-lg font-medium leading-tight">{p.nama}</h3>
            <p className={label}>
              Min. {p.minOrder} {p.satuan}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-medium leading-tight">{rupiah(p.harga)}</p>
          <p className={label}>per {p.satuan}</p>
        </div>
      </header>

      <p className="text-sm text-neutral-400">{p.deskripsi}</p>

      {p.hargaGrosir && (
        <p className="rounded-lg bg-orange-500/10 px-3 py-2 text-xs text-orange-300">
          Mulai {p.hargaGrosir.mulai} {p.satuan}: {rupiah(p.hargaGrosir.harga)}{" "}
          per {p.satuan}
        </p>
      )}

      <dl className="flex flex-col gap-3">
        {kelompok.map(({ k, items }) => (
          <div key={k}>
            <dt className={`${label} mb-1.5`}>
              {k}
              {p.pilih?.[k]
                ? ` · pilih ${p.pilih[k]} dari ${items.length}`
                : ""}
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              {items.map((m) => {
                const h = habis.has(m.id);
                return (
                  <span
                    key={m.id}
                    className={`${chip} ${
                      h ? "text-neutral-500 line-through" : "text-neutral-200"
                    }`}
                  >
                    {m.nama}
                    {h && <span className="sr-only"> (habis)</span>}
                  </span>
                );
              })}
            </dd>
          </div>
        ))}
        {p.bonus && (
          <div>
            <dt className={`${label} mb-1.5`}>Bonus pilihan</dt>
            <dd className="flex flex-wrap gap-1.5">
              {p.bonus.map((b) => (
                <span key={b} className={`${chip} text-neutral-200`}>
                  {b}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>

      {jumlahHabis > 0 && (
        <p className="mt-auto text-xs text-red-400">
          {jumlahHabis} menu di paket ini sedang habis
        </p>
      )}
    </article>
  );
}

function Saklar({
  aktif,
  nama,
  onToggle,
}: {
  aktif: boolean;
  nama: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={aktif}
      aria-label={`Tersedia: ${nama}`}
      onClick={onToggle}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 ${
        aktif ? "bg-orange-500" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white transition-transform ${
          aktif ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Halaman                                                             */
/* ------------------------------------------------------------------ */

type Tab = "paket" | "menu";

export default function MenuPaketPage() {
  const [tab, setTab] = useState<Tab>("paket");
  const [cari, setCari] = useState("");
  const [kategori, setKategori] = useState<"Semua" | Kategori>("Semua");
  const [habis, setHabis] = useState<Set<string>>(() => new Set());

  const q = cari.trim().toLowerCase();
  const cocok = (...teks: string[]) =>
    !q || teks.some((t) => t.toLowerCase().includes(q));

  const paketTampil = paket.filter((p) =>
    cocok(p.nama, p.deskripsi, ...menuDalam(p.id).map((m) => m.nama)),
  );
  const menuTampil = menu.filter(
    (m) =>
      (kategori === "Semua" || m.kategori === kategori) &&
      cocok(m.nama, m.kategori, ...m.paket.map(namaPaket)),
  );
  const jumlahHabis = menu.filter((m) => habis.has(m.id)).length;

  const toggleHabis = (id: string) =>
    setHabis((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <AppShell active="menu">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm">
            <ChefHat className="size-4 text-neutral-400" /> Menu & Paket
          </span>
          <span className={label}>
            {paket.length} Paket, {menu.length} Menu
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
        <div>
          <h1 className="text-3xl font-medium">Menu & Paket</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Daftar paket katering dan menu di dalamnya. Tandai menu yang sedang
            habis supaya terlihat di paket yang memakainya.
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10">
          <div role="tablist" className="flex gap-4 text-sm">
            {(
              [
                ["paket", `Paket (${paket.length})`],
                ["menu", `Menu (${menu.length})`],
              ] as const
            ).map(([t, nama]) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`-mb-px border-b-2 pb-2 transition-colors ${
                  tab === t
                    ? "border-white text-white"
                    : "border-transparent text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {nama}
              </button>
            ))}
          </div>
          <label className="relative mb-2 w-full sm:w-64">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500"
            />
            <input
              type="search"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder={tab === "paket" ? "Cari paket" : "Cari menu"}
              aria-label={tab === "paket" ? "Cari paket" : "Cari menu"}
              className="h-9 w-full rounded-lg border border-white/10 bg-transparent pl-9 pr-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus-visible:border-orange-500/60 focus-visible:outline-none"
            />
          </label>
        </div>

        {tab === "paket" ? (
          <div role="tabpanel">
            {paketTampil.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {paketTampil.map((p) => (
                  <KartuPaket key={p.id} p={p} habis={habis} />
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-neutral-500">
                Tidak ada paket yang cocok dengan “{cari}”.
              </p>
            )}
          </div>
        ) : (
          <div role="tabpanel" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1">
                {(["Semua", ...KATEGORI] as const).map((k) => (
                  <button
                    key={k}
                    aria-pressed={kategori === k}
                    onClick={() => setKategori(k)}
                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      kategori === k
                        ? "bg-white/10 text-white"
                        : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <span className={label}>
                {menu.length - jumlahHabis} tersedia, {jumlahHabis} habis
              </span>
            </div>

            <section className={`${card} overflow-hidden`}>
              {menuTampil.length > 0 ? (
                <ul className="divide-y divide-white/10">
                  {menuTampil.map((m) => {
                    const h = habis.has(m.id);
                    return (
                      <li
                        key={m.id}
                        className="flex items-center gap-4 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-sm ${
                              h
                                ? "text-neutral-500 line-through"
                                : "text-neutral-100"
                            }`}
                          >
                            {m.nama}
                          </p>
                          <p className={label}>{m.kategori}</p>
                        </div>
                        <div className="hidden flex-wrap justify-end gap-1.5 sm:flex">
                          {m.paket.map((id) => (
                            <span
                              key={id}
                              className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] text-neutral-300"
                            >
                              {namaPaket(id)}
                            </span>
                          ))}
                        </div>
                        <span
                          className={`w-14 text-right font-mono text-xs ${
                            h ? "text-red-400" : "text-neutral-400"
                          }`}
                        >
                          {h ? "Habis" : "Tersedia"}
                        </span>
                        <Saklar
                          aktif={!h}
                          nama={m.nama}
                          onToggle={() => toggleHabis(m.id)}
                        />
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="py-12 text-center text-sm text-neutral-500">
                  Tidak ada menu yang cocok.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
