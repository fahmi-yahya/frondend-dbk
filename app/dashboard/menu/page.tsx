"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import {
  Bell,
  Check,
  ChefHat,
  Pencil,
  Search,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  ambilPaketLengkap,
  pesanError,
  rp,
  type MenuItem,
  type PaketLengkap,
} from "@/lib/paket";

/* ------------------------------------------------------------------ */
/* Data dari API Laravel: GET /paket (paket + menunya).                */
/* Edit: PUT /paket/{id}, PUT /menu/{id}. Hapus: DELETE ...            */
/*                                                                     */
/* Tanda "Habis" belum punya kolom di database, jadi hanya berlaku     */
/* selama halaman terbuka (hilang saat di-refresh).                    */
/* ------------------------------------------------------------------ */

const card = "rounded-2xl border border-white/10 bg-[#141414]";
const label = "font-mono text-xs text-neutral-400";
const chip = "rounded-md bg-white/[0.06] px-2 py-1 text-xs";
const inp =
  "w-full rounded-lg border border-white/10 bg-[#1c1c1c] px-3 py-2 text-sm [color-scheme:dark] placeholder:text-neutral-600 focus:border-orange-500/60 focus:outline-none";
const aksi =
  "grid size-8 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-white/10 hover:text-neutral-200";

type Pesan = { ok: boolean; teks: string };
type BarisMenu = MenuItem & { idPaket: number; namaPaket: string };

/* ------------------------------------------------------------------ */
/* Komponen kecil                                                      */
/* ------------------------------------------------------------------ */

function KartuPaket({
  p,
  habis,
  onSimpan,
  onHapus,
}: {
  p: PaketLengkap;
  habis: Set<number>;
  onSimpan: (p: PaketLengkap, nama: string, harga: number) => Promise<boolean>;
  onHapus: (p: PaketLengkap) => void;
}) {
  const [edit, setEdit] = useState(false);
  const [nama, setNama] = useState(p.nama);
  const [harga, setHarga] = useState(String(p.harga));
  const jumlahHabis = p.menu.filter((m) => habis.has(m.id)).length;

  const simpan = async () => {
    if (!nama.trim() || !(Number(harga) > 0)) return;
    if (await onSimpan(p, nama.trim(), Number(harga))) setEdit(false);
  };

  return (
    <article className={`${card} flex flex-col gap-4 p-5`}>
      {edit ? (
        <div className="grid gap-2">
          <input
            className={inp}
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            aria-label="Nama paket"
          />
          <input
            type="number"
            min={0}
            className={inp}
            value={harga}
            onChange={(e) => setHarga(e.target.value)}
            aria-label="Harga per porsi"
          />
          <div className="flex gap-2">
            <button
              onClick={simpan}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black hover:bg-neutral-200"
            >
              <Check className="size-4" /> Simpan
            </button>
            <button
              onClick={() => {
                setEdit(false);
                setNama(p.nama);
                setHarga(String(p.harga));
              }}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/10"
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 text-orange-500">
              <Utensils className="size-5" />
            </span>
            <div>
              <h3 className="text-lg font-medium leading-tight">{p.nama}</h3>
              <p className={label}>{p.menu.length} menu</p>
            </div>
          </div>
          <div className="flex items-start gap-1">
            <div className="mr-1 text-right">
              <p className="text-lg font-medium leading-tight">{rp(p.harga)}</p>
              <p className={label}>per porsi</p>
            </div>
            <button
              onClick={() => setEdit(true)}
              className={aksi}
              aria-label={`Ubah ${p.nama}`}
            >
              <Pencil className="size-4" />
            </button>
            <button
              onClick={() => onHapus(p)}
              className={`${aksi} hover:text-red-400`}
              aria-label={`Hapus ${p.nama}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </header>
      )}

      {p.menu.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {p.menu.map((m, i) => {
            const h = habis.has(m.id);
            return (
              <span
                key={`${m.id}-${i}`}
                className={`${chip} ${h ? "text-neutral-500 line-through" : "text-neutral-200"}`}
              >
                {m.nama}
                {h && <span className="sr-only"> (habis)</span>}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">
          Belum ada menu.{" "}
          <Link
            href="/dashboard/menu/tambah-menu"
            className="underline hover:text-neutral-300"
          >
            Tambah menu
          </Link>
        </p>
      )}

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

function Baris({
  m,
  habis,
  onToggle,
  onSimpan,
  onHapus,
}: {
  m: BarisMenu;
  habis: boolean;
  onToggle: () => void;
  onSimpan: (m: BarisMenu, nama: string) => Promise<boolean>;
  onHapus: (m: BarisMenu) => void;
}) {
  const [edit, setEdit] = useState(false);
  const [nama, setNama] = useState(m.nama);

  const simpan = async () => {
    if (!nama.trim()) return;
    if (await onSimpan(m, nama.trim())) setEdit(false);
  };

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <div className="min-w-0 flex-1 basis-40">
        {edit ? (
          <input
            className={inp}
            value={nama}
            autoFocus
            onChange={(e) => setNama(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") simpan();
              if (e.key === "Escape") setEdit(false);
            }}
            aria-label="Nama menu"
          />
        ) : (
          <>
            <p
              className={`truncate text-sm ${habis ? "text-neutral-500 line-through" : "text-neutral-100"}`}
            >
              {m.nama}
            </p>
            <p className={label}>{m.namaPaket}</p>
          </>
        )}
      </div>
      {!edit && (
        <span
          className={`w-14 text-right font-mono text-xs ${habis ? "text-red-400" : "text-neutral-400"}`}
        >
          {habis ? "Habis" : "Tersedia"}
        </span>
      )}
      {!edit && <Saklar aktif={!habis} nama={m.nama} onToggle={onToggle} />}
      <div className="flex gap-1">
        {edit ? (
          <>
            <button onClick={simpan} className={aksi} aria-label="Simpan">
              <Check className="size-4" />
            </button>
            <button
              onClick={() => {
                setEdit(false);
                setNama(m.nama);
              }}
              className={aksi}
              aria-label="Batal"
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEdit(true)}
              className={aksi}
              aria-label={`Ubah ${m.nama}`}
            >
              <Pencil className="size-4" />
            </button>
            <button
              onClick={() => onHapus(m)}
              className={`${aksi} hover:text-red-400`}
              aria-label={`Hapus ${m.nama}`}
            >
              <Trash2 className="size-4" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Halaman                                                             */
/* ------------------------------------------------------------------ */

type Tab = "paket" | "menu";

export default function MenuPaketPage() {
  const [pakets, setPakets] = useState<PaketLengkap[]>([]);
  const [status, setStatus] = useState<"memuat" | "ok" | "gagal">("memuat");
  const [tab, setTab] = useState<Tab>("paket");
  const [cari, setCari] = useState("");
  const [filter, setFilter] = useState("Semua"); // id paket, atau "Semua"
  const [habis, setHabis] = useState<Set<number>>(() => new Set());
  const [pesan, setPesan] = useState<Pesan | null>(null);

  useEffect(() => {
    ambilPaketLengkap()
      .then((list) => {
        setPakets(list);
        setStatus("ok");
      })
      .catch(() => setStatus("gagal"));
  }, []);

  const segarkan = () => ambilPaketLengkap().then(setPakets);

  const semuaMenu: BarisMenu[] = pakets.flatMap((p) =>
    p.menu.map((m) => ({ ...m, idPaket: p.id, namaPaket: p.nama })),
  );

  const q = cari.trim().toLowerCase();
  const cocok = (...teks: string[]) =>
    !q || teks.some((t) => t.toLowerCase().includes(q));

  const paketTampil = pakets.filter((p) =>
    cocok(p.nama, ...p.menu.map((m) => m.nama)),
  );
  const menuTampil = semuaMenu.filter(
    (m) =>
      (filter === "Semua" || String(m.idPaket) === filter) &&
      cocok(m.nama, m.namaPaket),
  );
  const jumlahHabis = semuaMenu.filter((m) => habis.has(m.id)).length;

  const toggleHabis = (id: number) =>
    setHabis((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  // Jalankan aksi ke server, lalu muat ulang daftar
  const jalankan = async (aksiApi: () => Promise<unknown>, sukses: string) => {
    try {
      await aksiApi();
      await segarkan();
      setPesan({ ok: true, teks: sukses });
      return true;
    } catch (err) {
      setPesan({ ok: false, teks: pesanError(err) });
      return false;
    }
  };

  const simpanPaket = (p: PaketLengkap, nama: string, harga: number) =>
    jalankan(
      () => api.put(`/paket/${p.id}`, { nama_paket: nama, harga_paket: harga }),
      `Paket "${nama}" diperbarui.`,
    );
  const hapusPaket = (p: PaketLengkap) => {
    if (!confirm(`Hapus paket "${p.nama}" beserta ${p.menu.length} menunya?`))
      return;
    jalankan(() => api.delete(`/paket/${p.id}`), `Paket "${p.nama}" dihapus.`);
  };
  const simpanMenu = (m: BarisMenu, nama: string) =>
    jalankan(
      () => api.put(`/menu/${m.id}`, { id_paket: m.idPaket, nama_menu: nama }),
      `Menu "${nama}" diperbarui.`,
    );
  const hapusMenu = (m: BarisMenu) => {
    if (!confirm(`Hapus menu "${m.nama}" dari ${m.namaPaket}?`)) return;
    jalankan(() => api.delete(`/menu/${m.id}`), `Menu "${m.nama}" dihapus.`);
  };

  return (
    <AppShell active="menu">
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm">
            <ChefHat className="size-4 text-neutral-400" /> Menu & Paket
          </span>
          {status === "ok" && (
            <span className={label}>
              {pakets.length} Paket, {semuaMenu.length} Menu
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/menu/tambah-menu"
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
          >
            + Tambah Menu
          </Link>
          <Link
            href="/dashboard/menu/tambah-paket"
            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
          >
            + Tambah Paket
          </Link>
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
            Daftar paket katering dan menu di dalamnya. Ubah atau hapus lewat
            ikon di tiap baris.
          </p>
        </div>

        {status === "gagal" && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            Tidak bisa terhubung ke server. Pastikan Laravel berjalan dan
            NEXT_PUBLIC_API_URL sudah benar.
          </p>
        )}
        {pesan && (
          <p
            role="status"
            className={`rounded-lg border px-4 py-3 text-sm ${
              pesan.ok
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
            }`}
          >
            {pesan.teks}
          </p>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10">
          <div role="tablist" className="flex gap-4 text-sm">
            {(
              [
                ["paket", `Paket (${pakets.length})`],
                ["menu", `Menu (${semuaMenu.length})`],
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

        {status === "memuat" && (
          <p className="py-12 text-center text-sm text-neutral-500">
            Memuat data...
          </p>
        )}

        {status === "ok" && tab === "paket" && (
          <div role="tabpanel">
            {paketTampil.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {paketTampil.map((p) => (
                  <KartuPaket
                    key={p.id}
                    p={p}
                    habis={habis}
                    onSimpan={simpanPaket}
                    onHapus={hapusPaket}
                  />
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-neutral-500">
                {cari
                  ? `Tidak ada paket yang cocok dengan “${cari}”.`
                  : "Belum ada paket. Klik + Tambah Paket."}
              </p>
            )}
          </div>
        )}

        {status === "ok" && tab === "menu" && (
          <div role="tabpanel" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "Semua", nama: "Semua" },
                  ...pakets.map((p) => ({ id: String(p.id), nama: p.nama })),
                ].map((k) => (
                  <button
                    key={k.id}
                    aria-pressed={filter === k.id}
                    onClick={() => setFilter(k.id)}
                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      filter === k.id
                        ? "bg-white/10 text-white"
                        : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
                    }`}
                  >
                    {k.nama}
                  </button>
                ))}
              </div>
              <span className={label}>
                {semuaMenu.length - jumlahHabis} tersedia, {jumlahHabis} habis
              </span>
            </div>

            <section className={`${card} overflow-hidden`}>
              {menuTampil.length > 0 ? (
                <ul className="divide-y divide-white/10">
                  {menuTampil.map((m, i) => (
                    <Baris
                      key={`${m.id}-${i}`}
                      m={m}
                      habis={habis.has(m.id)}
                      onToggle={() => toggleHabis(m.id)}
                      onSimpan={simpanMenu}
                      onHapus={hapusMenu}
                    />
                  ))}
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
