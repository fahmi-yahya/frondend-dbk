import axios, { type AxiosResponse } from "axios";
import { api } from "@/lib/api";

// Bentuk yang dipakai halaman (diubah dari respons API Laravel)
export type MenuItem = { id: number; nama: string };
export type PaketLengkap = {
  id: number;
  nama: string;
  harga: number;
  menu: MenuItem[];
};
export type PaketApi = {
  id: number;
  nama: string;
  harga: number;
  isi: string[];
};

// "25000", "25.000", atau "25000.00" -> 25000
export const angka = (v: string | number) =>
  parseInt(
    String(v)
      .replace(/[.,]\d{1,2}$/, "")
      .replace(/\D/g, ""),
    10,
  ) || 0;

export const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

// Isi paket dari respons API. Laravel memberi nama relasi apa adanya
// (menu / menus / ...), jadi beberapa nama dicoba.
const menuDari = (p: Record<string, unknown>): MenuItem[] => {
  const sumber = p.menu ?? p.menus ?? p.daftar_menu ?? p.isi ?? [];
  if (!Array.isArray(sumber)) return [];
  return sumber
    .map((m) =>
      typeof m === "string"
        ? { id: 0, nama: m }
        : {
            id: Number((m as Record<string, unknown>)?.id ?? 0),
            nama: String((m as Record<string, unknown>)?.nama_menu ?? ""),
          },
    )
    .filter((m) => m.nama);
};

// GET /paket -> paket + menu (lengkap dengan id, untuk edit dan hapus)
export const ambilPaketLengkap = () =>
  api.get("/paket").then((res) => {
    const list = (Array.isArray(res.data) ? res.data : res.data?.data) ?? [];
    return list.map((p: Record<string, unknown>) => ({
      id: p.id as number,
      nama: String(p.nama_paket ?? ""),
      harga: angka(p.harga_paket as string | number),
      menu: menuDari(p),
    })) as PaketLengkap[];
  });

// Versi ringkas: isi paket hanya berupa nama menu
export const ambilPaket = () =>
  ambilPaketLengkap().then(
    (list) =>
      list.map((p) => ({
        id: p.id,
        nama: p.nama,
        harga: p.harga,
        isi: p.menu.map((m) => m.nama),
      })) as PaketApi[],
  );

// id dari respons POST (bisa langsung, atau dibungkus data / paket)
export const idDari = (res: AxiosResponse): number | undefined =>
  res.data?.id ?? res.data?.data?.id ?? res.data?.paket?.id;

// Pesan error yang enak dibaca dari respons Laravel
export const pesanError = (err: unknown) => {
  if (axios.isAxiosError(err)) {
    const e = err.response?.data?.errors as
      | Record<string, string[]>
      | undefined;
    if (e) return Object.values(e)[0][0]; // error validasi (422)
    return err.response?.data?.message ?? "Tidak bisa terhubung ke server.";
  }
  return "Terjadi kesalahan.";
};
