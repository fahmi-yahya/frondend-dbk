"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import { ambilPaket, pesanError, rp, type PaketApi } from "@/lib/paket";

const card = "rounded-2xl border border-white/10 bg-[#141414] p-5";
const inp =
  "w-full rounded-lg border border-white/10 bg-[#1c1c1c] px-3 py-2.5 text-sm [color-scheme:dark] placeholder:text-neutral-600 focus:border-orange-500/60 focus:outline-none";

export default function TambahMenuPage() {
  const [pakets, setPakets] = useState<PaketApi[]>([]);
  const [status, setStatus] = useState<"memuat" | "ok" | "gagal">("memuat");
  const [idPaket, setIdPaket] = useState("");
  const [daftar, setDaftar] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(
    null,
  );

  useEffect(() => {
    ambilPaket()
      .then((list) => {
        setPakets(list);
        setStatus("ok");
      })
      .catch(() => setStatus("gagal"));
  }, []);

  const paket = pakets.find((p) => String(p.id) === idPaket);

  // Satu menu per baris; menu yang sudah ada di paket itu dilewati
  const baris = Array.from(
    new Set(
      daftar
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
  const sudah = new Set((paket?.isi ?? []).map((m) => m.toLowerCase()));
  const baru = baris.filter((b) => !sudah.has(b.toLowerCase()));
  const dilewati = baris.length - baru.length;

  const simpan = async () => {
    if (!paket) return setPesan({ ok: false, teks: "Pilih paketnya dulu." });
    if (baru.length === 0)
      return setPesan({
        ok: false,
        teks: baris.length
          ? "Semua menu itu sudah ada di paket ini."
          : "Isi nama menu dulu.",
      });

    setMenyimpan(true);
    setPesan(null);
    const gagal: string[] = [];
    let pesanErr = "";
    for (const nama of baru) {
      try {
        await api.post("/menu", { id_paket: paket.id, nama_menu: nama });
      } catch (err) {
        gagal.push(nama);
        pesanErr = pesanError(err);
      }
    }
    // Muat ulang supaya daftar "isi paket" ikut terbaru
    ambilPaket()
      .then(setPakets)
      .catch(() => {});
    setMenyimpan(false);

    const berhasil = baru.length - gagal.length;
    if (gagal.length > 0) {
      setPesan({
        ok: false,
        teks: `${berhasil} menu tersimpan, ${gagal.length} gagal (${gagal.join(", ")}). ${pesanErr}`,
      });
      setDaftar(gagal.join("\n"));
      return;
    }
    setPesan({
      ok: true,
      teks: `${berhasil} menu ditambahkan ke ${paket.nama}${dilewati ? `, ${dilewati} dilewati karena sudah ada` : ""}.`,
    });
    setDaftar("");
  };

  return (
    <AppShell active="menu">
      <div className="px-6 py-5">
        <p className="text-xs text-neutral-500">
          <Link href="/dashboard/menu" className="hover:text-neutral-300">
            Menu & Paket
          </Link>{" "}
          <span className="mx-1">›</span>{" "}
          <span className="text-neutral-300">Tambah Menu</span>
        </p>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium">Tambah Menu</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Tambahkan satu atau beberapa menu ke sebuah paket.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/menu"
              className="flex items-center rounded-lg border border-white/10 bg-[#1c1c1c] px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
            >
              Kembali
            </Link>
            <button
              onClick={simpan}
              disabled={menyimpan}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-60"
            >
              <Check className="size-4" />
              {menyimpan ? "Menyimpan..." : "Simpan Menu"}
            </button>
          </div>
        </div>

        {status === "gagal" && (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            Daftar paket tidak bisa dimuat. Pastikan Laravel berjalan dan
            NEXT_PUBLIC_API_URL sudah benar.
          </p>
        )}
        {pesan && (
          <p
            role="status"
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              pesan.ok
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
            }`}
          >
            {pesan.teks}
          </p>
        )}

        <div className="mt-4 grid gap-4 pb-10 lg:max-w-2xl">
          <section className={card}>
            <h2 className="text-sm font-medium">Pilih Paket</h2>
            <label className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs text-neutral-400">Paket</span>
              <select
                className={inp}
                value={idPaket}
                onChange={(e) => setIdPaket(e.target.value)}
              >
                <option value="">
                  {status === "memuat" ? "Memuat paket..." : "Pilih paket"}
                </option>
                {pakets.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.nama} — {rp(p.harga)}
                  </option>
                ))}
              </select>
            </label>

            {paket && (
              <div className="mt-4 rounded-lg border border-white/10 bg-[#1c1c1c] p-3">
                <p className="text-xs text-neutral-400">
                  Isi {paket.nama} saat ini ({paket.isi.length} menu)
                </p>
                {paket.isi.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {paket.isi.map((m, i) => (
                      <span
                        key={`${m}-${i}`}
                        className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-neutral-200"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-neutral-500">
                    Belum ada menu.
                  </p>
                )}
              </div>
            )}
          </section>

          <section className={card}>
            <h2 className="text-sm font-medium">Menu Baru</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Satu menu per baris. Bisa langsung tempel banyak menu sekaligus.
            </p>
            <textarea
              rows={7}
              className={`${inp} mt-4`}
              placeholder={"Nasi Putih\nAyam Bakar\nSayur Asem"}
              value={daftar}
              onChange={(e) => setDaftar(e.target.value)}
            />
            {baris.length > 0 && (
              <p className="mt-2 text-xs text-neutral-500">
                {baru.length} menu akan ditambahkan
                {dilewati > 0
                  ? `, ${dilewati} dilewati karena sudah ada di paket`
                  : ""}
                .
              </p>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
