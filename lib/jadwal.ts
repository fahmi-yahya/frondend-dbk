import axios from "axios";
import type { Order } from "@/components/DetailPesanan";
import { api } from "@/lib/api";

/**
 * GET /api/jadwal?bulan=2026-10
 *
 * JadwalController mengembalikan PesananResource::collection(), resource yang
 * sama dengan GET /pesanan (Dashboard). Bentuknya sudah sama dengan tipe
 * Order (id, customer, item, tanggal, lokasi, amount, status, extra), jadi
 * TIDAK dipetakan ulang di sini. Field apa pun yang ditambahkan di
 * PesananResource otomatis ikut sampai ke jadwal dan Ringkasan Pesanan.
 */

// Hanya merapikan tipe data. Tidak ada field yang diganti nama atau dibuang.
const rapikan = (r: Order): Order => ({
  ...r,
  tanggal: String(r.tanggal).slice(0, 10), // jaga-jaga kalau berupa ISO datetime
  amount: Number(r.amount) || 0, // decimal dari Laravel sering berupa string
  // PHP mengirim array kosong sebagai [] (bukan {}), jadi disamakan
  extra: r.extra && !Array.isArray(r.extra) ? r.extra : {},
});

export async function ambilJadwal(
  bulan: string,
  signal?: AbortSignal,
): Promise<Order[]> {
  try {
    // Kalau route dipasang auth:sanctum, token ditambahkan di lib/api.ts
    // (interceptor), bukan di sini.
    const { data } = await api.get("/jadwal", { params: { bulan }, signal });

    // PesananResource::collection() membungkus hasil dalam { data: [...] }
    const daftar: Order[] = Array.isArray(data) ? data : (data.data ?? []);
    return daftar.map(rapikan);
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
