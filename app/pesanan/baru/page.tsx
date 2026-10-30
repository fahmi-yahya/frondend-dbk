"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Check,
  Eye,
  EyeOff,
  MapPin,
  Plus,
  Printer,
  Save,
  Send,
  X,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import {
  AreaCetak,
  RingkasanPesanan,
  hariDari,
  tanggalLengkap,
  usaha,
  type DataRingkasan,
} from "@/components/RingkasanPesanan";
import { api } from "@/lib/api";
import { esList, menuList, rupiah, supList } from "@/data/menu";

// Daftar paket diambil dari API Laravel (GET /paket).
// Kalau API belum jalan, dipakai daftar cadangan dari data/menu.ts.

const formKosong = {
  tanggal: "",
  nama: "",
  hp: "",
  lokasi: "",
  gps: "",
  jam: "",
  paket: "",
  sup: "",
  es: "",
  dataTambahan: "",
  jumlah: "",
  meja: "",
  taplak: "",
  waiters: "",
  keterangan: "",
};
type Form = typeof formKosong;
type PaketItem = { id?: number; nama: string; harga: number; isi: string[] };

// "25000", "25.000", atau "25000.00" -> 25000
const angka = (v: string | number) =>
  parseInt(
    String(v)
      .replace(/[.,]\d{1,2}$/, "")
      .replace(/\D/g, ""),
    10,
  ) || 0;

// Isi paket dari respons API. Laravel memberi nama relasi apa adanya
// (menu / menus / ...), jadi beberapa nama dicoba.
const ambilIsi = (p: Record<string, unknown>): string[] => {
  const sumber = p.menu ?? p.menus ?? p.daftar_menu ?? p.isi ?? [];
  if (!Array.isArray(sumber)) return [];
  return sumber
    .map((m) =>
      typeof m === "string"
        ? m
        : String((m as Record<string, unknown>)?.nama_menu ?? ""),
    )
    .filter(Boolean);
};

// Ambil pesan error yang enak dibaca dari respons Laravel
const pesanError = (err: unknown) => {
  if (axios.isAxiosError(err)) {
    const e = err.response?.data?.errors as
      | Record<string, string[]>
      | undefined;
    if (e) return Object.values(e)[0][0]; // error validasi (422)
    return err.response?.data?.message ?? "Tidak bisa terhubung ke server.";
  }
  return "Terjadi kesalahan.";
};

const card = "rounded-2xl border border-white/10 bg-[#141414] p-5";
const inp =
  "w-full rounded-lg border border-white/10 bg-[#1c1c1c] px-3 py-2.5 text-sm [color-scheme:dark] placeholder:text-neutral-600 focus:border-orange-500/60 focus:outline-none";
const btn =
  "flex items-center gap-2 rounded-lg border border-white/10 bg-[#1c1c1c] px-3 py-2 text-sm text-neutral-200 hover:bg-white/10";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs text-neutral-400">{label}</span>
      {children}
    </label>
  );
}

export default function PesananBaruPage() {
  const [form, setForm] = useState<Form>(formKosong);
  const [bonus, setBonus] = useState<string[]>([]);
  const [bonusInput, setBonusInput] = useState("");
  const [preview, setPreview] = useState(true);
  const [msg, setMsg] = useState("");

  const [daftarPaket, setDaftarPaket] = useState<PaketItem[]>(menuList);
  const [sumberPaket, setSumberPaket] = useState<"memuat" | "api" | "lokal">(
    "memuat",
  );
  const [menyimpan, setMenyimpan] = useState(false);
  // Terisi setelah pesanan berhasil disimpan ke server
  const [tersimpan, setTersimpan] = useState<{
    dbId: number;
    no: string;
  } | null>(null);

  // Ambil paket + isi menunya dari API
  useEffect(() => {
    api
      .get("/paket")
      .then((res) => {
        const list =
          (Array.isArray(res.data) ? res.data : res.data?.data) ?? [];
        setDaftarPaket(
          list.map((p: Record<string, unknown>) => ({
            id: p.id as number,
            nama: String(p.nama_paket ?? ""),
            harga: angka(p.harga_paket as string | number),
            isi: ambilIsi(p),
          })),
        );
        setSumberPaket("api");
      })
      .catch(() => setSumberPaket("lokal"));
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  // Pintasan untuk input teks: {...f("nama")}
  const f = (k: keyof Form) => ({
    value: form[k],
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => set(k, e.target.value),
  });

  const hari = hariDari(form.tanggal);
  const paketMenu = daftarPaket.find((p) => p.nama === form.paket);

  // Data ringkasan: nilai kosong ditulis "" (di layar tampil "-",
  // di kertas bagian itu disembunyikan)
  const data: DataRingkasan = {
    noPesanan: tersimpan?.no ?? "Baru",
    tanggal: tanggalLengkap(form.tanggal),
    jam: form.jam,
    nama: form.nama,
    hp: form.hp,
    lokasi: form.lokasi,
    gps: form.gps,
    menu: [
      {
        label: "Paket",
        nilai: paketMenu
          ? `${paketMenu.nama} — ${rupiah(paketMenu.harga)} / porsi`
          : form.paket,
      },
      { label: "Isi Paket", nilai: paketMenu ? paketMenu.isi.join("\n") : "" },
      { label: "Pilihan Sup", nilai: form.sup },
      { label: "Pilihan Es", nilai: form.es },
      { label: "Data Tambahan", nilai: form.dataTambahan },
    ],
    jumlah: form.jumlah,
    kebutuhan: [
      { label: "Jumlah Meja", nilai: form.meja },
      { label: "Warna Taplak", nilai: form.taplak },
      { label: "Waiters", nilai: form.waiters },
    ],
    bonus,
    keterangan: form.keterangan,
  };

  const tambahBonus = () => {
    const b = bonusInput.trim();
    if (!b) return;
    setBonus((x) => [...x, b]);
    setBonusInput("");
  };

  const ambilGps = () => {
    if (!navigator.geolocation)
      return setMsg("Browser ini tidak mendukung GPS.");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        set(
          "gps",
          `https://www.google.com/maps?q=${p.coords.latitude},${p.coords.longitude}`,
        );
        setMsg("Lokasi GPS terisi.");
      },
      () =>
        setMsg(
          "Gagal mengambil lokasi. Izinkan akses lokasi, atau tempel link Google Maps.",
        ),
    );
  };

  // Simpan pesanan ke server (baru: POST, sudah tersimpan: PUT)
  const simpanPesanan = async () => {
    const kurang = !form.tanggal
      ? "tanggal"
      : !form.nama
        ? "nama"
        : !form.hp
          ? "no HP"
          : !form.lokasi
            ? "lokasi"
            : !paketMenu
              ? "paket"
              : !(Number(form.jumlah) >= 1)
                ? "jumlah pesanan"
                : "";
    if (kurang) return setMsg(`Isi ${kurang} dulu.`);
    if (!paketMenu || paketMenu.id === undefined)
      return setMsg(
        "Daftar paket belum dari API, pesanan belum bisa disimpan.",
      );

    setMenyimpan(true);
    try {
      const payload = {
        tanggal: form.tanggal,
        nama: form.nama,
        hp: form.hp,
        lokasi: form.lokasi,
        gps: form.gps || null,
        jam_acara: form.jam || null,
        id_paket: paketMenu.id,
        pilihan_sup: form.sup || null,
        pilihan_es: form.es || null,
        data_tambahan: form.dataTambahan || null,
        jumlah_pesanan: Number(form.jumlah),
        jumlah_meja: form.meja === "" ? null : Number(form.meja),
        warna_taplak: form.taplak || null,
        waiters: form.waiters === "" ? null : Number(form.waiters),
        bonus,
        keterangan: form.keterangan || null,
      };
      const res = tersimpan
        ? await api.put(`/pesanan/${tersimpan.dbId}`, payload)
        : await api.post("/pesanan", payload);
      const p = res.data?.data ?? res.data;
      setTersimpan({ dbId: p.db_id, no: p.id });
      setMsg(`Pesanan ${p.id} tersimpan.`);
    } catch (err) {
      setMsg(pesanError(err));
    } finally {
      setMenyimpan(false);
    }
  };

  // Kosongkan form untuk pesanan berikutnya
  const pesananBaru = () => {
    setForm(formKosong);
    setBonus([]);
    setBonusInput("");
    setTersimpan(null);
    setMsg("");
  };

  const simpan = () => {
    try {
      localStorage.setItem("draft-pesanan", JSON.stringify({ form, bonus }));
      setMsg("Draft tersimpan di browser ini.");
    } catch {
      setMsg("Draft gagal disimpan.");
    }
  };
  const muat = () => {
    try {
      const d = localStorage.getItem("draft-pesanan");
      if (!d) return setMsg("Belum ada draft tersimpan.");
      const j = JSON.parse(d);
      setForm(j.form);
      setBonus(j.bonus);
      setMsg("Draft dimuat.");
    } catch {
      setMsg("Draft gagal dimuat.");
    }
  };
  const kirim = () => {
    if (!form.nama || !form.hp)
      return setMsg("Isi nama dan no HP pelanggan dulu.");
    const no = form.hp.replace(/\D/g, "").replace(/^0/, "62");
    const rows: [string, string][] = [
      ["Lokasi", data.lokasi],
      ["Hari / Tanggal", data.tanggal],
      ["Jam Acara", data.jam],
      ...data.menu.map((m): [string, string] => [m.label, m.nilai]),
      ["Jumlah Pesanan", data.jumlah],
      ...data.kebutuhan.map((k): [string, string] => [k.label, k.nilai]),
      ["Bonus", data.bonus.join(", ")],
      ["Keterangan", data.keterangan],
    ];
    const lines = [
      `Halo ${form.nama}, berikut konfirmasi pesanan katering Anda di ${usaha.nama}:`,
      ...rows.map(([k, v]) => `${k}: ${v || "-"}`),
      "Terima kasih!",
    ];
    window.open(
      `https://wa.me/${no}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
    );
    setMsg("Konfirmasi dibuka di WhatsApp.");
  };

  return (
    <AppShell active="Pesanan">
      {/* Versi cetak (hanya muncul saat Ctrl+P / tombol Cetak) */}
      <AreaCetak data={data} />

      <div className="px-6 py-5">
        <p className="text-xs text-neutral-500">
          Pesanan <span className="mx-1">›</span>{" "}
          <span className="text-neutral-300">Pesanan Baru</span>
        </p>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium">Pesanan Baru</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Isi data acara, simpan pesanan, lalu kirim konfirmasi ke
              pelanggan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setPreview(!preview)} className={btn}>
              {preview ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
              {preview ? "Sembunyikan Preview" : "Tampilkan Preview"}
            </button>
            <button onClick={simpan} className={btn}>
              <Save className="size-4" /> Simpan Draft
            </button>
            <button onClick={() => window.print()} className={btn}>
              <Printer className="size-4" /> Cetak
            </button>
            <button onClick={kirim} className={btn}>
              <Send className="size-4" /> Kirim WA
            </button>
            <button
              onClick={simpanPesanan}
              disabled={menyimpan}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-60"
            >
              <Check className="size-4" />
              {menyimpan
                ? "Menyimpan..."
                : tersimpan
                  ? "Perbarui Pesanan"
                  : "Simpan Pesanan"}
            </button>
          </div>
        </div>
        <p className="mt-2 min-h-5 text-xs text-neutral-500">
          {msg}{" "}
          <button onClick={muat} className="underline hover:text-neutral-300">
            Muat draft
          </button>
          {tersimpan && (
            <>
              {" · "}
              <button
                onClick={pesananBaru}
                className="underline hover:text-neutral-300"
              >
                Buat pesanan baru
              </button>
            </>
          )}
        </p>

        <div
          className={`mt-3 grid gap-4 pb-10 ${preview ? "xl:grid-cols-2" : ""}`}
        >
          {/* Form */}
          <div className="space-y-4">
            <section className={card}>
              <h2 className="text-sm font-medium">Data Pelanggan & Acara</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Siapa yang memesan, kapan, dan di mana.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Tanggal">
                  <input type="date" className={inp} {...f("tanggal")} />
                </Field>
                <Field label="Hari">
                  <input
                    className={`${inp} opacity-60`}
                    value={hari}
                    placeholder="Silakan input tanggal"
                    readOnly
                  />
                </Field>
                <Field label="Nama">
                  <input className={inp} {...f("nama")} />
                </Field>
                <Field label="No HP">
                  <input
                    type="tel"
                    className={inp}
                    placeholder="08123456789"
                    {...f("hp")}
                  />
                </Field>
                <Field label="Lokasi" className="sm:col-span-2">
                  <input className={inp} {...f("lokasi")} />
                </Field>
                <Field label="GPS" className="sm:col-span-2">
                  <div className="relative">
                    <input
                      className={`${inp} pr-11`}
                      placeholder="Tempel link Google Maps, atau tekan ikon pin"
                      {...f("gps")}
                    />
                    <button
                      type="button"
                      onClick={ambilGps}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-400 hover:bg-white/10 hover:text-orange-400"
                      aria-label="Ambil lokasi GPS"
                    >
                      <MapPin className="size-4" />
                    </button>
                  </div>
                </Field>
                <Field label="Jam Acara" className="sm:col-span-2">
                  <input
                    className={inp}
                    placeholder="Cth. 10.00 WIB"
                    {...f("jam")}
                  />
                </Field>
              </div>
            </section>

            <section className={card}>
              <h2 className="text-sm font-medium">Menu</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Paket dan pilihan hidangan.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Paket" className="sm:col-span-2">
                  <select className={inp} {...f("paket")}>
                    <option value="">
                      {sumberPaket === "memuat"
                        ? "Memuat paket..."
                        : "Pilih paket"}
                    </option>
                    {daftarPaket.map((m) => (
                      <option key={m.nama} value={m.nama}>
                        {m.nama} — {rupiah(m.harga)}
                      </option>
                    ))}
                  </select>
                </Field>
                {sumberPaket === "lokal" && (
                  <p className="text-xs text-amber-400 sm:col-span-2">
                    API belum tersambung: paket dari data/menu.ts, pesanan belum
                    bisa disimpan ke server.
                  </p>
                )}
                {paketMenu && (
                  <div className="rounded-lg border border-white/10 bg-[#1c1c1c] p-3 sm:col-span-2">
                    <p className="text-xs text-neutral-400">
                      Isi {paketMenu.nama} · {rupiah(paketMenu.harga)} / porsi
                    </p>
                    {paketMenu.isi.length === 0 && (
                      <p className="mt-2 text-xs text-amber-400">
                        Paket ini belum punya menu di API. Pastikan GET /paket
                        memuat relasi menu (with(&apos;menu&apos;)) dan paketnya
                        punya baris di tabel menu.
                      </p>
                    )}
                    <ul className="mt-2 grid gap-x-4 gap-y-1 text-sm text-neutral-200 sm:grid-cols-2">
                      {paketMenu.isi.map((x, i) => (
                        <li key={`${x}-${i}`} className="flex gap-2">
                          <span className="text-orange-400">•</span>
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-neutral-400">Pilihan Sup</span>
                  <div className="grid grid-cols-2 gap-2">
                    {supList.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set("sup", form.sup === s ? "" : s)}
                        className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                          form.sup === s
                            ? "border-orange-500/60 bg-orange-500/15 text-orange-300"
                            : "border-white/10 bg-[#1c1c1c] text-neutral-300 hover:bg-white/10"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Pilihan Es">
                  <select className={inp} {...f("es")}>
                    <option value="">Pilih es</option>
                    {esList.map((e) => (
                      <option key={e}>{e}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Data Tambahan" className="sm:col-span-2">
                  <input className={inp} {...f("dataTambahan")} />
                </Field>
              </div>
            </section>

            <section className={card}>
              <h2 className="text-sm font-medium">Kebutuhan Acara</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Jumlah porsi, meja, dan perlengkapan.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Jumlah Pesanan">
                  <input
                    type="number"
                    min={0}
                    className={inp}
                    {...f("jumlah")}
                  />
                </Field>
                <Field label="Jumlah Meja">
                  <input type="number" min={0} className={inp} {...f("meja")} />
                </Field>
                <Field label="Warna Taplak">
                  <input className={inp} {...f("taplak")} />
                </Field>
                <Field label="Waiters">
                  <input
                    type="number"
                    min={0}
                    className={inp}
                    {...f("waiters")}
                  />
                </Field>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-xs text-neutral-400">Bonus</span>
                  <div className="relative">
                    <input
                      className={`${inp} pr-11`}
                      placeholder="Ketik bonus, lalu tekan + atau Enter"
                      value={bonusInput}
                      onChange={(e) => setBonusInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          tambahBonus();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={tambahBonus}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-400 hover:bg-white/10 hover:text-orange-400"
                      aria-label="Tambah bonus"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  {bonus.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {bonus.map((b, i) => (
                        <span
                          key={`${b}-${i}`}
                          className="flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-xs text-orange-300"
                        >
                          {b}
                          <button
                            onClick={() =>
                              setBonus((x) => x.filter((_, j) => j !== i))
                            }
                            aria-label={`Hapus ${b}`}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Field label="Keterangan Tambahan" className="sm:col-span-2">
                  <textarea rows={3} className={inp} {...f("keterangan")} />
                </Field>
              </div>
            </section>
          </div>

          {/* Preview ringkasan (tampilan sama dengan hasil cetak) */}
          {preview && (
            <aside className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:self-start">
              <h2 className="shrink-0 border-b border-neutral-200 px-5 py-3.5 text-sm font-medium text-neutral-900">
                Preview
              </h2>
              <div className="min-h-0 overflow-y-auto bg-neutral-100 p-4 sm:p-6">
                <div className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
                  <RingkasanPesanan data={data} />
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </AppShell>
  );
}
