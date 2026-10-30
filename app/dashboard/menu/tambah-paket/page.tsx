"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Plus, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import { idDari, pesanError, rp } from "@/lib/paket";

const card = "rounded-2xl border border-white/10 bg-[#141414] p-5";
const inp =
  "w-full rounded-lg border border-white/10 bg-[#1c1c1c] px-3 py-2.5 text-sm [color-scheme:dark] placeholder:text-neutral-600 focus:border-orange-500/60 focus:outline-none";
const iconBtn =
  "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-400 hover:bg-white/10 hover:text-orange-400";

export default function TambahPaketPage() {
  const [nama, setNama] = useState("");
  const [harga, setHarga] = useState("");
  const [menu, setMenu] = useState<string[]>([]);
  const [menuInput, setMenuInput] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(
    null,
  );

  const tambahMenu = () => {
    const m = menuInput.trim();
    if (!m) return;
    setMenu((x) => [...x, m]);
    setMenuInput("");
  };

  const simpan = async () => {
    const hargaAngka = Number(harga);
    if (!nama.trim())
      return setPesan({ ok: false, teks: "Isi nama paket dulu." });
    if (!(hargaAngka > 0))
      return setPesan({ ok: false, teks: "Isi harga paket dulu." });

    setMenyimpan(true);
    setPesan(null);
    try {
      const res = await api.post("/paket", {
        nama_paket: nama.trim(),
        harga_paket: hargaAngka,
      });

      if (menu.length > 0) {
        const id = idDari(res);
        if (id === undefined) {
          return setPesan({
            ok: false,
            teks: "Paket tersimpan, tapi id-nya tidak terbaca dari API, jadi menu belum ditambahkan. Tambahkan lewat halaman Tambah Menu.",
          });
        }
        const gagal: string[] = [];
        for (const m of menu) {
          try {
            await api.post("/menu", { id_paket: id, nama_menu: m });
          } catch {
            gagal.push(m);
          }
        }
        if (gagal.length > 0) {
          return setPesan({
            ok: false,
            teks: `Paket tersimpan, tapi ${gagal.length} menu gagal disimpan: ${gagal.join(", ")}.`,
          });
        }
      }

      setPesan({
        ok: true,
        teks: `Paket "${nama.trim()}" tersimpan${menu.length ? ` dengan ${menu.length} menu` : ""}.`,
      });
      setNama("");
      setHarga("");
      setMenu([]);
      setMenuInput("");
    } catch (err) {
      setPesan({ ok: false, teks: pesanError(err) });
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <AppShell active="menu">
      <div className="px-6 py-5">
        <p className="text-xs text-neutral-500">
          <Link href="/dashboard/menu" className="hover:text-neutral-300">
            Menu & Paket
          </Link>{" "}
          <span className="mx-1">›</span>{" "}
          <span className="text-neutral-300">Tambah Paket</span>
        </p>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium">Tambah Paket</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Buat paket baru beserta isi menunya.
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
              {menyimpan ? "Menyimpan..." : "Simpan Paket"}
            </button>
          </div>
        </div>

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
            {pesan.ok && (
              <>
                {" "}
                <Link href="/dashboard/menu" className="underline">
                  Lihat daftar
                </Link>
              </>
            )}
          </p>
        )}

        <div className="mt-4 grid gap-4 pb-10 lg:max-w-2xl">
          <section className={card}>
            <h2 className="text-sm font-medium">Data Paket</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs text-neutral-400">Nama Paket</span>
                <input
                  className={inp}
                  placeholder="Cth. Menu 9"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-neutral-400">
                  Harga per porsi (Rp)
                </span>
                <input
                  type="number"
                  min={0}
                  className={inp}
                  placeholder="Cth. 53000"
                  value={harga}
                  onChange={(e) => setHarga(e.target.value)}
                />
                {Number(harga) > 0 && (
                  <span className="text-xs text-neutral-500">
                    {rp(Number(harga))} / porsi
                  </span>
                )}
              </label>
            </div>
          </section>

          <section className={card}>
            <h2 className="text-sm font-medium">Isi Paket</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Tambahkan menu satu per satu. Boleh dikosongkan dan diisi nanti
              lewat Tambah Menu.
            </p>
            <div className="relative mt-4">
              <input
                className={`${inp} pr-11`}
                placeholder="Ketik nama menu, lalu tekan + atau Enter"
                value={menuInput}
                onChange={(e) => setMenuInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    tambahMenu();
                  }
                }}
              />
              <button
                type="button"
                onClick={tambahMenu}
                className={iconBtn}
                aria-label="Tambah menu"
              >
                <Plus className="size-4" />
              </button>
            </div>
            {menu.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {menu.map((m, i) => (
                  <span
                    key={`${m}-${i}`}
                    className="flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-xs text-orange-300"
                  >
                    {m}
                    <button
                      onClick={() =>
                        setMenu((x) => x.filter((_, j) => j !== i))
                      }
                      aria-label={`Hapus ${m}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
