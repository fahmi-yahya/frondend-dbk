import axios from "axios";
import { o, type Order } from "@/components/DetailPesanan";
import { api } from "@/lib/api";

/**
 * Bentuk satu item dari PesananResource.
 *
 * Nama field di bawah ini tebakan. Samakan dengan toArray() di
 * PesananResource kamu. Yang perlu diubah cukup tipe ini dan fungsi
 * dariApi() di bawah; halaman jadwal tidak perlu disentuh.
 */
type PesananApi = {
  id: number | string;
  kode?: string | null; // contoh "#K001"; kalau kosong dipakai "#<id>"
  pelanggan: string;
  item: string; // contoh "Nasi Box ×80"
  tanggal: string; // "2026-10-30"
  jam_acara?: string | null; // "10:00:00", "10:00", atau null
  total: number | string;
  status: string; // Lunas | DP | Batal
  lokasi: string;
  hp?: string | null;
  gps?: string | null;
  sup?: string | null;
  es?: string | null;
  meja?: number | string | null;
  taplak?: string | null;
  waiters?: number | string | null;
  bonus?: string[] | null;
  keterangan?: string | null;
};

type Extra = NonNullable<Parameters<typeof o>[7]>;

const STATUS: Record<string, string> = {
  lunas: "Lunas",
  dp: "DP",
  batal: "Batal",
};

// "10:00:00" / "10:00" / "10.00" -> "10.00 WIB". Kosong -> undefined,
// sehingga acara masuk ke baris "Tanpa Jam".
function formatJam(jam?: string | null) {
  const m = jam?.match(/^(\d{1,2})[.:](\d{2})/);
  return m ? `${m[1].padStart(2, "0")}.${m[2]} WIB` : undefined;
}

const teks = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? undefined : String(v);

function dariApi(r: PesananApi): Order {
  const extra: Record<string, unknown> = {
    hp: teks(r.hp),
    jam: formatJam(r.jam_acara),
    gps: teks(r.gps),
    sup: teks(r.sup),
    es: teks(r.es),
    meja: teks(r.meja),
    taplak: teks(r.taplak),
    waiters: teks(r.waiters),
    bonus: r.bonus?.length ? r.bonus : undefined,
    keterangan: teks(r.keterangan),
  };
  for (const k of Object.keys(extra)) {
    if (extra[k] === undefined) delete extra[k];
  }

  return o(
    r.kode ?? `#${r.id}`,
    r.pelanggan,
    r.item,
    r.tanggal.slice(0, 10), // jaga-jaga kalau API mengirim ISO datetime
    Number(r.total), // decimal dari Laravel sering berupa string
    (STATUS[r.status.toLowerCase()] ?? r.status) as Order["status"],
    r.lokasi,
    extra as Extra,
  );
}

/** GET /api/jadwal?bulan=2026-10 */
export async function ambilJadwal(
  bulan: string,
  signal?: AbortSignal,
): Promise<Order[]> {
  try {
    // Kalau route dipasang auth:sanctum, token ditambahkan di lib/api.ts
    // (interceptor), bukan di sini.
    const { data } = await api.get("/jadwal", { params: { bulan }, signal });

    // PesananResource::collection() membungkus hasil dalam { data: [...] }
    const daftar: PesananApi[] = Array.isArray(data) ? data : (data.data ?? []);
    return daftar.map(dariApi);
  } catch (e) {
    if (axios.isCancel(e)) throw e; // dibatalkan karena ganti bulan

    if (axios.isAxiosError(e)) {
      // Alamat lengkap yang benar-benar dipanggil, contoh:
      // http://localhost:8000/api/jadwal?bulan=2026-10
      // Kalau hanya "/api/jadwal?...", artinya NEXT_PUBLIC_API_URL belum terbaca.
      const url = api.getUri(e.config);

      if (!e.response) {
        if (e.code === "ECONNABORTED" || e.code === "ETIMEDOUT") {
          throw new Error(`Server terlalu lama merespons (${url})`);
        }
        throw new Error(
          `Tidak bisa terhubung ke ${url} [${e.code ?? "tanpa respons"}]. ` +
            "Server mati, alamat salah, atau diblokir CORS.",
        );
      }
      // Laravel dengan APP_DEBUG=true mengirim penyebab error di "message"
      const pesan = e.response.data?.message;
      throw new Error(
        `Gagal memuat jadwal (${e.response.status})${
          typeof pesan === "string" && pesan ? `: ${pesan.slice(0, 200)}` : ""
        }`,
      );
    }
    throw e;
  }
}
