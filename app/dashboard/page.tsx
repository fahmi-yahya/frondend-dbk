"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { DetailPesanan, type Order } from "@/components/DetailPesanan";
import { tanggalSingkat } from "@/components/RingkasanPesanan";
import { api } from "@/lib/api";
import {
  LayoutDashboard,
  TrendingUp,
  Bell,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Tipe & bantuan                                                       */
/* Data diambil dari API Laravel: GET /dashboard dan GET /pesanan.      */
/* ------------------------------------------------------------------ */

type Stat = {
  label: string;
  value: string;
  prefix?: string;
  delta: string;
  up: boolean;
};
type Periode = {
  label: string;
  value: number;
  income: number;
  dari: string;
  sampai: string;
};
type MenuTerlaris = {
  name: string;
  income: string;
  orders: number;
  growth: number;
  portions: string;
};

const LABEL_STAT = [
  "Total Pesanan",
  "Pendapatan",
  "Pelanggan Baru",
  "Pelanggan Repeat",
];
const LABEL_PERIODE = [
  "Jan–Feb",
  "Mar–Apr",
  "Mei–Jun",
  "Jul–Agu",
  "Sep–Okt",
  "Nov–Des",
];

// Isi awal sebelum data dari server datang
const statAwal: Stat[] = LABEL_STAT.map((label) => ({
  label,
  value: "–",
  delta: "0%",
  up: true,
}));
const periodeAwal: Periode[] = LABEL_PERIODE.map((label) => ({
  label,
  value: 0,
  income: 0,
  dari: "",
  sampai: "",
}));

const juta = (n: number) =>
  `${(n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
const rpJt = (n: number) =>
  n >= 1e6 ? `Rp ${juta(n)}` : `Rp ${n.toLocaleString("id-ID")}`;

const bentukStat = (s: {
  label: string;
  value: number;
  delta: number;
}): Stat => {
  const pendapatan = s.label === "Pendapatan";
  return {
    label: s.label,
    prefix: pendapatan ? "Rp" : undefined,
    value: pendapatan
      ? s.value >= 1e6
        ? juta(s.value)
        : s.value.toLocaleString("id-ID")
      : s.label === "Pelanggan Repeat"
        ? `${s.value} %`
        : s.value.toLocaleString("id-ID"),
    delta: `${s.delta >= 0 ? "+" : ""}${s.delta}%`,
    up: s.delta >= 0,
  };
};

// Pesanan satu periode (maksimal 100, lalu dipaginasi di layar)
const ambilOrders = (p: Periode) =>
  api
    .get("/pesanan", {
      params: { dari: p.dari, sampai: p.sampai, per_page: 100 },
    })
    .then((res) => (res.data?.data ?? []) as Order[]);

const card = "rounded-2xl border border-white/10 bg-[#141414] p-5";
const label = "font-mono text-xs text-neutral-400";

/* ------------------------------------------------------------------ */
/* Paginasi                                                             */
/* ------------------------------------------------------------------ */

// Jumlah baris per halaman. Naikkan (mis. 10) kalau datanya sudah banyak.
const PER_HAL = 3;

function Pagination({
  total,
  page,
  perPage,
  onPage,
}: {
  total: number;
  page: number;
  perPage: number;
  onPage: (n: number) => void;
}) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  const nomor: (number | "…")[] = [];
  for (let n = 1; n <= pages; n++) {
    if (pages <= 5 || n === 1 || n === pages || Math.abs(n - page) <= 1)
      nomor.push(n);
    else if (nomor[nomor.length - 1] !== "…") nomor.push("…");
  }
  const tombol =
    "grid size-8 place-items-center rounded-lg text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <nav
      aria-label="Navigasi halaman"
      className="mt-4 flex flex-col items-center justify-between gap-3 text-xs text-neutral-500 sm:flex-row"
    >
      <p>
        Menampilkan {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)}{" "}
        dari {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          aria-label="Halaman sebelumnya"
          className={`${tombol} text-neutral-400 hover:bg-white/5`}
        >
          <ChevronLeft className="size-4" />
        </button>
        {nomor.map((n, i) =>
          n === "…" ? (
            <span key={`titik-${i}`} className="px-1">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPage(n)}
              aria-current={n === page ? "page" : undefined}
              className={`${tombol} ${
                n === page
                  ? "bg-white/10 text-neutral-100"
                  : "text-neutral-400 hover:bg-white/5"
              }`}
            >
              {n}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page === pages}
          aria-label="Halaman berikutnya"
          className={`${tombol} text-neutral-400 hover:bg-white/5`}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Halaman                                                              */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const [stats, setStats] = useState<Stat[]>(statAwal);
  const [periods, setPeriods] = useState<Periode[]>(periodeAwal);
  const [products, setProducts] = useState<MenuTerlaris[]>([]);
  const [tahun, setTahun] = useState<number | null>(null);
  const [sumber, setSumber] = useState<"memuat" | "api" | "gagal">("memuat");
  const [ordersMap, setOrdersMap] = useState<Record<string, Order[]>>({});
  const [rb, setRb] = useState(0);
  const [sel, setSel] = useState<Order | null>(null);
  const [hal, setHal] = useState(1);
  const [halMenu, setHalMenu] = useState(1);

  // Ambil ringkasan dashboard dari API
  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => {
        const d = res.data;
        const per: Periode[] = d.periode ?? periodeAwal;
        setStats(
          LABEL_STAT.map((nama) => {
            const s = (d.stats ?? []).find(
              (x: { label: string }) => x.label === nama,
            );
            return s
              ? bentukStat(s)
              : { label: nama, value: "–", delta: "0%", up: true };
          }),
        );
        setPeriods(per);
        setTahun(d.tahun ?? null);
        setProducts(
          (d.menu_terlaris ?? []).map(
            (m: {
              nama: string;
              pesanan: number;
              porsi: number;
              pendapatan: number;
              pertumbuhan: number;
            }) => ({
              name: m.nama,
              income: rpJt(m.pendapatan),
              orders: m.pesanan,
              growth: m.pertumbuhan,
              portions: m.porsi.toLocaleString("id-ID"),
            }),
          ),
        );
        // Pilih periode (2 bulan) yang sedang berjalan, lalu muat pesanannya
        const i = Math.min(
          Math.floor(new Date().getMonth() / 2),
          per.length - 1,
        );
        setRb(i);
        const p = per[i];
        if (p?.dari) {
          ambilOrders(p)
            .then((list) => setOrdersMap((m) => ({ ...m, [p.dari]: list })))
            .catch(() => {});
        }
        setSumber("api");
      })
      .catch(() => setSumber("gagal"));
  }, []);

  const cur = periods[rb];
  const maxCount = Math.max(1, ...periods.map((r) => r.value));
  const totalOrders = periods.reduce((sum, r) => sum + r.value, 0);

  const orders = ordersMap[cur.dari] ?? [];
  const memuatOrders = Boolean(cur.dari) && !ordersMap[cur.dari];
  const halOrder = Math.min(
    hal,
    Math.max(1, Math.ceil(orders.length / PER_HAL)),
  );
  const orderTampil = orders.slice(
    (halOrder - 1) * PER_HAL,
    halOrder * PER_HAL,
  );
  const halMenuAman = Math.min(
    halMenu,
    Math.max(1, Math.ceil(products.length / PER_HAL)),
  );
  const menuTampil = products.slice(
    (halMenuAman - 1) * PER_HAL,
    halMenuAman * PER_HAL,
  );

  // Perubahan dibanding periode (2 bulan) sebelumnya
  const sebelumnya = rb > 0 ? periods[rb - 1].value : 0;
  const perubahan =
    sebelumnya > 0
      ? Math.round(((cur.value - sebelumnya) / sebelumnya) * 1000) / 10
      : null;

  // Ganti periode (batang grafik) -> halaman 1, muat pesanannya kalau belum ada
  const pilihPeriode = (i: number) => {
    if (i === rb) return;
    setRb(i);
    setHal(1);
    const p = periods[i];
    if (p.dari && !ordersMap[p.dari]) {
      ambilOrders(p)
        .then((list) => setOrdersMap((m) => ({ ...m, [p.dari]: list })))
        .catch(() => {});
    }
  };

  return (
    <AppShell active="Dashboard">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm">
            <LayoutDashboard className="size-4 text-neutral-400" /> Dashboard
          </span>
          {sumber === "api" && (
            <span className={label}>{stats[0].value} pesanan bulan ini</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pesanan/baru"
            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
          >
            + Pesanan Baru
          </Link>
          <button className="grid size-9 place-items-center rounded-lg border border-white/10 text-neutral-400 hover:text-white">
            <Bell className="size-4" />
          </button>
          <div className="grid size-9 place-items-center rounded-full bg-orange-500 text-sm font-semibold text-black">
            A
          </div>
        </div>
      </header>

      <div className="space-y-5 px-6 pb-10">
        <h1 className="text-3xl font-medium">Selamat pagi, Admin</h1>

        {sumber === "gagal" && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            Tidak bisa terhubung ke server. Pastikan Laravel berjalan dan
            NEXT_PUBLIC_API_URL di .env.local sudah benar.
          </p>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-[#141414] p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-300">{s.label}</p>
                <span
                  className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] ${
                    s.up
                      ? "bg-indigo-500/15 text-indigo-300"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {s.up ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {s.delta}
                </span>
              </div>
              <p className="mt-2 text-2xl font-medium">
                {s.prefix && (
                  <span className="text-orange-500">{s.prefix} </span>
                )}
                {s.value}
              </p>
              <p className="mt-3 font-mono text-[10px] text-neutral-500">
                Bulan ini · dibanding bulan lalu
              </p>
            </div>
          ))}
        </div>

        {/* Grafik + pesanan periode yang dipilih */}
        <div className="grid gap-4 xl:grid-cols-[5fr_8fr]">
          <section className={card}>
            <p className={label}>Total Pesanan{tahun ? ` ${tahun}` : ""}</p>
            <p className="mt-1 font-mono text-2xl">
              {totalOrders.toLocaleString("id-ID")}
            </p>
            {perubahan !== null && (
              <p className="mt-2 font-mono text-xs">
                <span
                  className={perubahan >= 0 ? "text-green-500" : "text-red-500"}
                >
                  {Math.abs(perubahan).toLocaleString("id-ID")}%{" "}
                  {perubahan >= 0 ? "↑" : "↓"}
                </span>{" "}
                <span className="text-neutral-500">
                  Dibanding periode sebelumnya
                </span>
              </p>
            )}
            <div className="relative mt-10 h-56">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="absolute inset-x-0 border-t border-white/5"
                  style={{ top: `${i * 33.3}%` }}
                />
              ))}
              <div
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/30"
                style={{ bottom: `${(cur.value / maxCount) * 100}%` }}
              />
              <div className="relative flex h-full gap-2 sm:gap-3">
                {periods.map((r, i) => (
                  <div
                    key={r.label}
                    className="flex flex-1 items-end"
                    onMouseEnter={() => pilihPeriode(i)}
                    onClick={() => pilihPeriode(i)}
                  >
                    <div
                      className={`relative w-full rounded-lg transition-all ${
                        i === rb
                          ? "bg-gradient-to-b from-white via-orange-500 to-orange-600"
                          : "bg-gradient-to-b from-neutral-700 to-neutral-800"
                      }`}
                      style={{
                        height: `${(r.value / maxCount) * 100}%`,
                        minHeight: 4,
                      }}
                    >
                      {i === rb && (
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-neutral-900 px-2.5 py-1 font-mono text-[11px]">
                          {r.value} pesanan
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex gap-2 sm:gap-3">
              {periods.map((r, i) => (
                <span
                  key={r.label}
                  className={`flex-1 text-center font-mono text-[10px] leading-tight ${
                    i === rb ? "text-white" : "text-neutral-500"
                  }`}
                >
                  {r.label}
                </span>
              ))}
            </div>
          </section>

          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-neutral-300">Pesanan {cur.label}</p>
                <p className={`${label} mt-1`}>
                  {cur.value} pesanan · menampilkan {orders.length}
                </p>
              </div>
              <span className="rounded-md bg-orange-500/15 px-2 py-1 font-mono text-xs text-orange-400">
                Pendapatan {rpJt(cur.income)}
              </span>
            </div>

            {orders.length === 0 ? (
              <p className="mt-6 rounded-lg bg-white/5 px-4 py-6 text-center text-sm text-neutral-500">
                {memuatOrders
                  ? "Memuat pesanan..."
                  : "Belum ada pesanan di periode ini."}
              </p>
            ) : (
              <>
                {/* Tabel Tanggal | Lokasi: klik baris untuk melihat detail */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full table-fixed text-sm">
                    <thead>
                      <tr className="bg-white/5 text-left text-[11px] uppercase text-neutral-400">
                        <th className="w-28 px-3 py-2.5 font-medium first:rounded-l-lg sm:w-44">
                          Tanggal
                        </th>
                        <th className="px-3 py-2.5 font-medium last:rounded-r-lg">
                          Lokasi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orderTampil.map((od) => (
                        <tr
                          key={od.id}
                          tabIndex={0}
                          title="Klik untuk melihat detail pesanan"
                          onClick={() => setSel(od)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSel(od);
                            }
                          }}
                          className="cursor-pointer transition-colors hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none"
                        >
                          <td className="whitespace-nowrap px-3 py-3 font-mono text-neutral-400">
                            {tanggalSingkat(od.tanggal)}
                          </td>
                          <td className="break-words px-3 py-3">{od.lokasi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-neutral-500">
                  Klik salah satu baris untuk melihat detail pesanan.
                </p>
                <Pagination
                  total={orders.length}
                  page={halOrder}
                  perPage={PER_HAL}
                  onPage={setHal}
                />
              </>
            )}
          </section>
        </div>

        {/* Menu terlaris */}
        <section className={card}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-300">
              Menu Terlaris{tahun ? ` ${tahun}` : ""}
            </p>
          </div>

          {products.length === 0 ? (
            <p className="mt-6 rounded-lg bg-white/5 px-4 py-6 text-center text-sm text-neutral-500">
              {sumber === "memuat"
                ? "Memuat..."
                : "Belum ada data menu terlaris."}
            </p>
          ) : (
            <>
              {/* Layar lebar: tabel */}
              <div className="mt-4 hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 text-left text-[11px] uppercase text-neutral-400">
                      {[
                        "Menu",
                        "Pendapatan",
                        "Pesanan",
                        "Pertumbuhan",
                        "Porsi",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 font-medium first:rounded-l-lg last:rounded-r-lg"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {menuTampil.map((p) => (
                      <tr key={p.name}>
                        <td className="px-3 py-3">{p.name}</td>
                        <td className="px-3 py-3 font-mono">{p.income}</td>
                        <td className="px-3 py-3 font-mono">{p.orders}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`flex items-center gap-1 font-mono ${p.growth >= 0 ? "text-indigo-300" : "text-red-400"}`}
                          >
                            {p.growth >= 0 ? (
                              <ArrowUpRight className="size-3.5" />
                            ) : (
                              <ArrowDownRight className="size-3.5" />
                            )}
                            {Math.abs(p.growth)}%
                          </span>
                        </td>
                        <td className="px-3 py-3 font-mono">{p.portions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Layar kecil: satu kartu per menu, tanpa geser kiri-kanan */}
              <ul className="mt-4 divide-y divide-white/5 lg:hidden">
                {menuTampil.map((p) => (
                  <li key={p.name} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 break-words text-sm font-medium">
                        {p.name}
                      </p>
                      <span className="shrink-0 font-mono text-sm">
                        {p.income}
                      </span>
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-neutral-500">
                      <span>{p.orders} pesanan</span>
                      <span>{p.portions} porsi</span>
                      <span
                        className={`flex items-center gap-0.5 ${p.growth >= 0 ? "text-indigo-300" : "text-red-400"}`}
                      >
                        {p.growth >= 0 ? (
                          <ArrowUpRight className="size-3.5" />
                        ) : (
                          <ArrowDownRight className="size-3.5" />
                        )}
                        {Math.abs(p.growth)}%
                      </span>
                    </p>
                  </li>
                ))}
              </ul>

              <Pagination
                total={products.length}
                page={halMenuAman}
                perPage={PER_HAL}
                onPage={setHalMenu}
              />
            </>
          )}
        </section>
      </div>

      {sel && <DetailPesanan order={sel} onClose={() => setSel(null)} />}
    </AppShell>
  );
}
