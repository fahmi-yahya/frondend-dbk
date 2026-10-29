"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ChefHat,
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

// Ubah daftar pilihan di bawah ini sesuai menu usahamu
const paketList = ["Paket Hemat", "Paket Standar", "Paket Premium"];
const supList = ["Bakso", "Kimlo"];
const esList = ["Es Teh", "Es Buah", "Es Campur"];

// Identitas usaha & nomor pesanan yang tampil di ringkasan / hasil cetak
const usaha = { nama: "Dapur Nusa", alamat: "Jl. Contoh No. 1" };
const noPesanan = "#K186";

const fmt = (d: string) =>
  d
    ? new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "-";

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

/* ------------------------------------------------------------------ */
/* Ringkasan pesanan (dipakai untuk preview di layar DAN untuk cetak)  */
/* ------------------------------------------------------------------ */

type Pasang = { label: string; nilai: string };
type DataRingkasan = {
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

function Ringkasan({
  data: d,
  cetak = false,
}: {
  data: DataRingkasan;
  cetak?: boolean;
}) {
  // Di layar semua bagian tampil (kosong = "-").
  // Di kertas, bagian yang kosong disembunyikan.
  const ada = (v: string) => !cetak || v !== "";

  const peta = d.gps.startsWith("http") ? d.gps : "";
  const bonus = d.bonus.join(", ");
  const menu = d.menu.filter((m) => ada(m.nilai));
  const kebutuhan = d.kebutuhan.filter((k) => ada(k.nilai));
  const adaKotak = kebutuhan.length > 0 || ada(d.jumlah);
  const adaKiri = ada(d.lokasi) || ada(peta) || ada(bonus);

  return (
    <article className="text-sm leading-relaxed text-neutral-900">
      {/* Logo */}
      <div className="grid size-12 place-items-center rounded-xl bg-neutral-900 text-white">
        <ChefHat className="size-6" />
      </div>

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

/*
  Area cetak dipasang langsung di <body> lewat portal, supaya hasil cetak
  tidak terpengaruh sidebar / layout AppShell. Di layar area ini tersembunyi.
*/
const subscribeKosong = () => () => {};

function AreaCetak({ children }: { children: React.ReactNode }) {
  const siap = useSyncExternalStore(
    subscribeKosong,
    () => true,
    () => false,
  );
  if (!siap) return null;
  return createPortal(
    <div id="area-cetak" className="hidden print:block">
      {children}
    </div>,
    document.body,
  );
}

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

/* ------------------------------------------------------------------ */
/* Halaman                                                             */
/* ------------------------------------------------------------------ */

export default function PesananBaruPage() {
  const [form, setForm] = useState({
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
  });
  const [bonus, setBonus] = useState<string[]>([]);
  const [bonusInput, setBonusInput] = useState("");
  const [preview, setPreview] = useState(true);
  const [msg, setMsg] = useState("");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const hari = form.tanggal
    ? new Date(`${form.tanggal}T00:00:00`).toLocaleDateString("id-ID", {
        weekday: "long",
      })
    : "";

  // Data ringkasan: nilai kosong ditulis "" (di layar tampil "-",
  // di kertas bagian itu disembunyikan)
  const data: DataRingkasan = {
    noPesanan,
    tanggal: hari ? `${hari}, ${fmt(form.tanggal)}` : "",
    jam: form.jam,
    nama: form.nama,
    hp: form.hp,
    lokasi: form.lokasi,
    gps: form.gps,
    menu: [
      { label: "Paket", nilai: form.paket },
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
      <style>{cssCetak}</style>

      {/* Versi cetak (hanya muncul saat Ctrl+P / tombol Cetak) */}
      <AreaCetak>
        <Ringkasan data={data} cetak />
      </AreaCetak>

      <div className="px-6 py-5">
        <p className="text-xs text-neutral-500">
          Pesanan <span className="mx-1">›</span>{" "}
          <span className="text-neutral-300">Pesanan Baru</span>
        </p>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium">Pesanan Baru</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Isi data acara, lalu kirim konfirmasi ke pelanggan.
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
              onClick={kirim}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
            >
              <Send className="size-4" /> Kirim Pesanan
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
                  <input
                    type="date"
                    className={inp}
                    value={form.tanggal}
                    onChange={(e) => set("tanggal", e.target.value)}
                  />
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
                  <input
                    className={inp}
                    value={form.nama}
                    onChange={(e) => set("nama", e.target.value)}
                  />
                </Field>
                <Field label="No HP">
                  <input
                    type="tel"
                    className={inp}
                    placeholder="08123456789"
                    value={form.hp}
                    onChange={(e) => set("hp", e.target.value)}
                  />
                </Field>
                <Field label="Lokasi" className="sm:col-span-2">
                  <input
                    className={inp}
                    value={form.lokasi}
                    onChange={(e) => set("lokasi", e.target.value)}
                  />
                </Field>
                <Field label="GPS" className="sm:col-span-2">
                  <div className="relative">
                    <input
                      className={`${inp} pr-11`}
                      placeholder="Tempel link Google Maps, atau tekan ikon pin"
                      value={form.gps}
                      onChange={(e) => set("gps", e.target.value)}
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
                    value={form.jam}
                    onChange={(e) => set("jam", e.target.value)}
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
                    value={form.paket}
                    onChange={(e) => set("paket", e.target.value)}
                  >
                    <option value="">Pilih paket</option>
                    {paketList.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
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
                  <select
                    className={inp}
                    value={form.es}
                    onChange={(e) => set("es", e.target.value)}
                  >
                    <option value="">Pilih es</option>
                    {esList.map((e) => (
                      <option key={e}>{e}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Data Tambahan" className="sm:col-span-2">
                  <input
                    className={inp}
                    value={form.dataTambahan}
                    onChange={(e) => set("dataTambahan", e.target.value)}
                  />
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
                    value={form.jumlah}
                    onChange={(e) => set("jumlah", e.target.value)}
                  />
                </Field>
                <Field label="Jumlah Meja">
                  <input
                    type="number"
                    min={0}
                    className={inp}
                    value={form.meja}
                    onChange={(e) => set("meja", e.target.value)}
                  />
                </Field>
                <Field label="Warna Taplak">
                  <input
                    className={inp}
                    value={form.taplak}
                    onChange={(e) => set("taplak", e.target.value)}
                  />
                </Field>
                <Field label="Waiters">
                  <input
                    type="number"
                    min={0}
                    className={inp}
                    value={form.waiters}
                    onChange={(e) => set("waiters", e.target.value)}
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
                  <textarea
                    rows={3}
                    className={inp}
                    value={form.keterangan}
                    onChange={(e) => set("keterangan", e.target.value)}
                  />
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
                  <Ringkasan data={data} />
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </AppShell>
  );
}
