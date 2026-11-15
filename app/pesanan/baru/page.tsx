"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Check,
  Download,
  Eye,
  EyeOff,
  Loader2,
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
import { menuList, rupiah } from "@/data/menu";

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
  dataTambahan: "",
  jumlah: "",
  meja: "",
  taplak: "",
  keterangan: "",
};
type Form = typeof formKosong;
type PaketItem = { id?: number; nama: string; harga: number; isi: string[] };

// Item isi paket berbentuk "Bakso / Sup Kimlo" = pelanggan memilih salah satu
const opsi = (x: string) => x.split(/\s*\/\s*/).filter(Boolean);

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

// Isian GPS boleh diketik / ditempel, lalu diubah jadi link Google Maps supaya
// tampil di ringkasan, cetak, PDF, dan detail pesanan:
//  "-8.1724, 113.6995"           -> https://www.google.com/maps?q=-8.1724,113.6995
//  "maps.app.goo.gl/abc"         -> https://maps.app.goo.gl/abc
//  "https://maps.google.com/..." -> dipakai apa adanya
const gpsKeLink = (v: string) => {
  const t = v.trim();
  if (!t) return "";
  const k = t.match(/^(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (k && Math.abs(Number(k[1])) <= 90 && Math.abs(Number(k[2])) <= 180)
    return `https://www.google.com/maps?q=${k[1]},${k[2]}`;
  if (/^https?:\/\//i.test(t)) return t;
  if (
    /^(www\.)?(google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(
      t,
    )
  )
    return `https://${t}`;
  return t;
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
  // Pilihan pelanggan untuk item "A / B" di isi paket (kunci = urutan item)
  const [pilihan, setPilihan] = useState<Record<number, string>>({});
  const [preview, setPreview] = useState(true);
  const [msg, setMsg] = useState("");

  const [daftarPaket, setDaftarPaket] = useState<PaketItem[]>(menuList);
  const [sumberPaket, setSumberPaket] = useState<"memuat" | "api" | "lokal">(
    "memuat",
  );
  const [menyimpan, setMenyimpan] = useState(false);
  const [mengunduh, setMengunduh] = useState(false);
  // Proses ambil lokasi GPS + pesan hasilnya (tampil tepat di bawah isian GPS)
  const [mencariGps, setMencariGps] = useState(false);
  const [gpsInfo, setGpsInfo] = useState<{
    galat: boolean;
    teks: string;
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
  const gpsLink = gpsKeLink(form.gps);
  const gpsAdaLink = gpsLink.startsWith("http");
  const paketMenu = daftarPaket.find((p) => p.nama === form.paket);
  // "A / B" diganti pilihan pelanggan kalau sudah dipilih
  const isiTerpilih = (paketMenu?.isi ?? []).map((x, i) =>
    opsi(x).length > 1 && pilihan[i] ? pilihan[i] : x,
  );

  // Data ringkasan: nilai kosong ditulis "" (di layar tampil "-",
  // di kertas bagian itu disembunyikan)
  const data: DataRingkasan = {
    noPesanan: "Baru",
    tanggal: tanggalLengkap(form.tanggal),
    jam: form.jam,
    nama: form.nama,
    hp: form.hp,
    lokasi: form.lokasi,
    gps: gpsLink,
    menu: [
      {
        label: "Paket",
        nilai: paketMenu
          ? `${paketMenu.nama} — ${rupiah(paketMenu.harga)} / porsi`
          : form.paket,
      },
      { label: "Isi Paket", nilai: isiTerpilih.join("\n") },
      { label: "Data Tambahan", nilai: form.dataTambahan },
    ],
    jumlah: form.jumlah,
    kebutuhan: [
      { label: "Jumlah Meja", nilai: form.meja },
      { label: "Warna Taplak", nilai: form.taplak },
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
    const manual = "Ketik koordinat atau tempel link Google Maps.";
    if (!("geolocation" in navigator))
      return setGpsInfo({
        galat: true,
        teks: `Browser ini tidak mendukung GPS. ${manual}`,
      });
    // Browser hanya memberi lokasi di halaman https:// atau localhost
    if (!window.isSecureContext)
      return setGpsInfo({
        galat: true,
        teks: `GPS hanya jalan di https:// atau localhost. ${manual}`,
      });

    setMencariGps(true);
    setGpsInfo(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude, longitude } = p.coords;
        set(
          "gps",
          `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`,
        );
        setGpsInfo({ galat: false, teks: "Lokasi GPS terisi." });
        setMencariGps(false);
      },
      (e) => {
        setGpsInfo({
          galat: true,
          teks:
            e.code === e.PERMISSION_DENIED
              ? `Akses lokasi ditolak. Izinkan lokasi di browser, atau ${manual.toLowerCase()}`
              : e.code === e.TIMEOUT
                ? `Mencari lokasi terlalu lama. Coba lagi, atau ${manual.toLowerCase()}`
                : `Lokasi tidak tersedia. ${manual}`,
        });
        setMencariGps(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  // Simpan pesanan ke server. Kalau berhasil, form langsung dikosongkan
  // supaya siap dipakai untuk pesanan berikutnya.
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
    const belumPilih = paketMenu?.isi.find(
      (x, i) => opsi(x).length > 1 && !pilihan[i],
    );
    if (belumPilih) return setMsg(`Pilih salah satu dulu: ${belumPilih}.`);
    if (!paketMenu || paketMenu.id === undefined)
      return setMsg(
        "Daftar paket belum dari API, pesanan belum bisa disimpan.",
      );

    // Pilihan "A / B" yang dipilih pelanggan (sup & es tetap disimpan di kolom lama)
    const terpilih = paketMenu.isi.flatMap((x, i) =>
      opsi(x).length > 1 && pilihan[i] ? [pilihan[i]] : [],
    );

    setMenyimpan(true);
    try {
      const payload = {
        tanggal: form.tanggal,
        nama: form.nama,
        hp: form.hp,
        lokasi: form.lokasi,
        gps: gpsLink || null,
        jam_acara: form.jam || null,
        id_paket: paketMenu.id,
        pilihan_sup:
          terpilih.find((x) => /bakso|kimlo|sup|soto/i.test(x)) ?? null,
        pilihan_es: terpilih.find((x) => /^es\b/i.test(x)) ?? null,
        data_tambahan: form.dataTambahan || null,
        jumlah_pesanan: Number(form.jumlah),
        jumlah_meja: form.meja === "" ? null : Number(form.meja),
        warna_taplak: form.taplak || null,
        bonus,
        keterangan: form.keterangan || null,
      };
      const res = await api.post("/pesanan", payload);
      const p = res.data?.data ?? res.data;
      kosongkanForm();
      setMsg(
        p?.id
          ? `Pesanan ${p.id} tersimpan. Form sudah dikosongkan.`
          : "Pesanan tersimpan. Form sudah dikosongkan.",
      );
    } catch (err) {
      setMsg(pesanError(err));
    } finally {
      setMenyimpan(false);
    }
  };

  // Unduh ringkasan sebagai file PDF (library PDF baru dimuat saat tombol ditekan)
  const unduhPdf = async () => {
    if (!form.nama) return setMsg("Isi nama pelanggan dulu.");
    setMengunduh(true);
    try {
      const { unduhPdf: buatPdf } = await import("@/components/RingkasanPdf");
      await buatPdf(data);
      setMsg("PDF diunduh.");
    } catch (err) {
      console.error("Gagal membuat PDF:", err);
      setMsg("PDF gagal dibuat. Coba lagi.");
    } finally {
      setMengunduh(false);
    }
  };

  // Kosongkan form untuk pesanan berikutnya
  const kosongkanForm = () => {
    setForm(formKosong);
    setBonus([]);
    setBonusInput("");
    setPilihan({});
    setGpsInfo(null);
  };

  const simpan = () => {
    try {
      localStorage.setItem(
        "draft-pesanan",
        JSON.stringify({ form, bonus, pilihan }),
      );
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
      setPilihan(j.pilihan ?? {});
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
            <button
              onClick={unduhPdf}
              disabled={mengunduh}
              className={`${btn} disabled:opacity-60`}
            >
              <Download className="size-4" />{" "}
              {mengunduh ? "Membuat PDF..." : "Unduh PDF"}
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
              {menyimpan ? "Menyimpan..." : "Simpan Pesanan"}
            </button>
          </div>
        </div>
        <p className="mt-2 min-h-5 text-xs text-neutral-500">
          {msg}{" "}
          <button onClick={muat} className="underline hover:text-neutral-300">
            Muat draft
          </button>
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
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label htmlFor="gps" className="text-xs text-neutral-400">
                    GPS
                  </label>
                  <div className="relative">
                    <input
                      id="gps"
                      autoComplete="off"
                      className={`${inp} pr-11`}
                      placeholder="Ketik koordinat / tempel link Google Maps, atau tekan ikon pin"
                      value={form.gps}
                      onChange={(e) => {
                        set("gps", e.target.value);
                        setGpsInfo(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={ambilGps}
                      disabled={mencariGps}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-400 hover:bg-white/10 hover:text-orange-400 disabled:cursor-wait disabled:opacity-60"
                      aria-label="Ambil lokasi GPS"
                      title="Ambil lokasi saya sekarang"
                    >
                      {mencariGps ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <MapPin className="size-4" />
                      )}
                    </button>
                  </div>
                  {gpsInfo ? (
                    <p
                      className={`text-xs ${gpsInfo.galat ? "text-amber-400" : "text-green-400"}`}
                    >
                      {gpsInfo.teks}
                    </p>
                  ) : mencariGps ? (
                    <p className="text-xs text-neutral-500">
                      Mencari lokasi… izinkan akses lokasi kalau diminta
                      browser.
                    </p>
                  ) : form.gps.trim() && !gpsAdaLink ? (
                    <p className="text-xs text-amber-400">
                      Belum berupa link atau koordinat, jadi belum tampil
                      sebagai peta. Contoh koordinat: -8.1724, 113.6995
                    </p>
                  ) : null}
                  {gpsAdaLink && (
                    <a
                      href={gpsLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-fit text-xs text-orange-400 underline"
                    >
                      Cek di Google Maps
                    </a>
                  )}
                </div>
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
                  <select
                    className={inp}
                    {...f("paket")}
                    onChange={(e) => {
                      set("paket", e.target.value);
                      setPilihan({});
                    }}
                  >
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
                    <ul className="mt-2 grid gap-x-4 gap-y-2 text-sm text-neutral-200 sm:grid-cols-2">
                      {paketMenu.isi.map((x, i) => {
                        const o = opsi(x);
                        if (o.length < 2)
                          return (
                            <li key={`${x}-${i}`} className="flex gap-2">
                              <span className="text-orange-400">•</span>
                              {x}
                            </li>
                          );
                        // Item "A / B": pelanggan memilih salah satu langsung di sini
                        return (
                          <li
                            key={`${x}-${i}`}
                            className="flex flex-wrap items-center gap-2 sm:col-span-2"
                          >
                            <span className="text-orange-400">•</span>
                            <span className="text-neutral-400">Pilih:</span>
                            {o.map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() =>
                                  setPilihan((v) => ({
                                    ...v,
                                    [i]: v[i] === p ? "" : p,
                                  }))
                                }
                                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                  pilihan[i] === p
                                    ? "border-orange-500/60 bg-orange-500/15 text-orange-300"
                                    : "border-white/10 bg-[#141414] text-neutral-300 hover:bg-white/10"
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
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
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
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
                <div className="flex flex-col gap-1.5 sm:col-span-3">
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

                <Field label="Keterangan Tambahan" className="sm:col-span-3">
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
