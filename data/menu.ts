// Data menu & paket katering, disalin dari brosur (Menu 1–8).
// Harga per porsi, dalam rupiah. Ubah di sini kalau harga atau isi menu berubah.
// Simpan file ini di data/menu.ts (sejajar dengan folder components).

export type Menu = {
  nama: string;
  harga: number; // per porsi
  isi: string[]; // urutan sama seperti di brosur
};

// Pilihan yang berlaku untuk semua menu:
// "Bakso / Sup Kimlo" dan "Es Manado / Es Teler"
export const supList = ["Bakso", "Kimlo"];
export const esList = ["Es Manado", "Es Teler"];

export const menuList: Menu[] = [
  {
    nama: "Menu 1",
    harga: 53000,
    isi: [
      "Nasi Putih",
      "Nasi Goreng",
      "Sate Ayam",
      "Bakso / Sup Kimlo",
      "Cah Sayur DBK",
      "Es Manado / Es Teler",
      "Buah Potong",
      "Bonelles Chiken",
      "Ice Cream",
      "Air Mineral",
    ],
  },
  {
    nama: "Menu 2",
    harga: 58000,
    isi: [
      "Nasi Putih",
      "Nasi Goreng Sosis",
      "Gule",
      "Sate Kambing",
      "Bakso / Sup Kimlo",
      "Cah Jagung Muda",
      "Es Manado / Es Teler",
      "Buah Potong",
      "Ice Cream",
      "Air Mineral",
    ],
  },
  {
    nama: "Menu 3",
    harga: 61000,
    isi: [
      "Nasi Putih",
      "Nasi Goreng",
      "Sate Ayam",
      "Bakso / Sup Kimlo",
      "Bistik Daging",
      "Cah Sayur DBK",
      "Es Manado / Es Teler",
      "Buah Potong",
      "Bonelles Chiken",
      "Ice Cream",
      "Air Mineral",
    ],
  },
  {
    nama: "Menu 4",
    harga: 63000,
    isi: [
      "Nasi Putih",
      "Nasi Goreng Sosis",
      "Gule",
      "Sate Kambing",
      "Bakso / Sup Kimlo",
      "Tahu Campur Lamongan",
      "Cah Jagung Muda",
      "Es Manado / Es Teler",
      "Bonelles Chiken",
      "Ice Cream",
      "Welcome Drink",
      "Air Mineral",
    ],
  },
  {
    nama: "Menu 5",
    harga: 64000,
    isi: [
      "Nasi Putih",
      "Nasi Goreng Sosis",
      "Gule",
      "Sate Kambing",
      "Bakso / Sup Kimlo",
      "Bistik Daging",
      "Cah Jagung Muda",
      "Es Manado / Es Teler",
      "Buah Potong",
      "Bonelles Chiken",
      "Ice Cream",
      "Air Mineral",
    ],
  },
  {
    nama: "Menu 6",
    harga: 65000,
    isi: [
      "Nasi Putih",
      "Nasi Goreng Sosis",
      "Gule",
      "Sate Kambing",
      "Bakso / Sup Kimlo",
      "Tahu Campur Lamongan",
      "Cah Jagung Sosis",
      "Es Manado / Es Teler",
      "Buah Potong",
      "Bonelles Chiken",
      "Ice Cream",
      "Welcome Drink",
      "Air Mineral",
    ],
  },
  {
    nama: "Menu 7",
    harga: 69000,
    isi: [
      "Nasi Putih",
      "Nasi Goreng Sosis",
      "Gule",
      "Sate Kambing",
      "Bakso / Sup Kimlo",
      "Bistik Daging",
      "Tahu Campur Lamongan",
      "Cah Jagung Muda",
      "Es Manado / Es Teler",
      "Buah Potong",
      "Bonelles Chiken",
      "Ice Cream",
      "Welcome Drink",
      "Air Mineral",
    ],
  },
  {
    nama: "Menu 8",
    harga: 73000,
    isi: [
      "Nasi Putih",
      "Nasi Goreng Sosis",
      "Gule",
      "Sate Kambing",
      "Bakso / Sup Kimlo",
      "Bistik Daging",
      "Tahu Campur Lamongan",
      "Cah Jagung Sosis",
      "Es Manado / Es Teler",
      "Buah Potong",
      "Sop Buntut",
      "Aneka Puding",
      "Bonelles Chiken",
      "Ice Cream",
      "Welcome Drink",
      "Air Mineral",
    ],
  },
];

export const cariMenu = (nama: string) => menuList.find((m) => m.nama === nama);

/** 53000 → "Rp 53.000" */
export const rupiah = (n: number) =>
  "Rp " + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
