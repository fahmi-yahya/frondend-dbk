"use client";

// File PDF ringkasan pesanan (diunduh langsung, tanpa dialog cetak).
// Isinya sama dengan preview karena memakai bagianDari() yang sama.
// Butuh: npm install @react-pdf/renderer
//
// Pemakaian (dimuat saat tombol ditekan, jadi tidak memberatkan halaman):
//   const { unduhPdf } = await import("@/components/RingkasanPdf");
//   await unduhPdf(data);

import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import {
  KALIMAT_PENUTUP,
  bagianDari,
  type Baris,
  type DataRingkasan,
} from "./RingkasanPesanan";

const abu = "#737373";
const garis = "#d4d4d4";

const s = StyleSheet.create({
  halaman: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#171717",
  },
  // lineHeight sengaja di sini, bukan di style Page: di react-pdf, lineHeight di Page
  // membuat teks footer (nomor halaman) tidak tampil.
  isi: { fontSize: 10, lineHeight: 1.35 },
  kepala: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { height: 46 },
  namaUsaha: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  judulDok: { fontSize: 8, fontFamily: "Helvetica-Bold", color: abu, letterSpacing: 1.5, textAlign: "right" },
  nomor: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: garis,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontFamily: "Courier",
    fontSize: 10,
    alignSelf: "flex-end",
  },
  bagian: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: garis,
    borderRadius: 6,
    overflow: "hidden",
  },
  judulBagian: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: garis,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  bulat: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#171717",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  angka: { color: "#fff", fontSize: 8, lineHeight: 1, fontFamily: "Helvetica-Bold", textAlign: "center", marginTop: 1 },
  teksJudul: { fontSize: 8, lineHeight: 1, fontFamily: "Helvetica-Bold", color: "#404040", letterSpacing: 0.8, marginTop: 1 },
  baris: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8 },
  garisAtas: { borderTopWidth: 1, borderTopColor: "#e5e5e5" },
  label: { width: "36%", color: abu, paddingRight: 8 },
  nilai: { flex: 1 },
  sorot: { backgroundColor: "#fafafa" },
  tebal: { fontFamily: "Helvetica-Bold" },
  labelIsi: { fontSize: 8, color: abu, marginBottom: 3 },
  kolomIsi: { flexDirection: "row" },
  itemIsi: { flexDirection: "row", marginBottom: 1.5, paddingRight: 6 },
  titik: { width: 9, color: "#a3a3a3" },
  isiBagian: { paddingVertical: 5, paddingHorizontal: 8 },
  nomorHalaman: {
    position: "absolute",
    bottom: 16,
    left: 36,
    right: 36,
    fontSize: 8,
    color: abu,
    textAlign: "center",
  },
});

// Daftar hidangan dibagi 3 kolom, mengalir ke bawah per kolom (seperti di preview)
function IsiPaket({ nilai }: { nilai: string }) {
  const daftar = nilai.split("\n").filter(Boolean);
  const perKolom = Math.ceil(daftar.length / 3) || 1;
  const kolom = [0, 1, 2]
    .map((k) => daftar.slice(k * perKolom, (k + 1) * perKolom))
    .filter((k) => k.length > 0);
  return (
    <View style={s.kolomIsi}>
      {kolom.map((k, i) => (
        <View key={i} style={{ flex: 1 }}>
          {k.map((x, j) => (
            <View key={j} style={s.itemIsi} wrap={false}>
              <Text style={s.titik}>•</Text>
              <Text style={{ flex: 1 }}>{x}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function BarisPdf({ r, pertama }: { r: Baris; pertama: boolean }) {
  const garisAtas = pertama ? {} : s.garisAtas;

  if (r.tipe === "isi") {
    return (
      <View style={[s.isiBagian, garisAtas]} wrap={false}>
        <Text style={s.labelIsi}>{r.label}</Text>
        <IsiPaket nilai={r.nilai} />
      </View>
    );
  }

  return (
    <View style={[s.baris, garisAtas, r.tipe === "sorot" ? s.sorot : {}]} wrap={false}>
      <Text style={s.label}>{r.label}</Text>
      <View style={s.nilai}>
        {r.tipe === "peta" ? (
          <Link src={r.nilai} style={{ color: "#c2410c" }}>
            {r.nilai}
          </Link>
        ) : (
          <Text style={r.tipe === "sorot" ? s.tebal : undefined}>{r.nilai}</Text>
        )}
      </View>
    </View>
  );
}

export function RingkasanPdf({
  data: d,
  logo,
}: {
  data: DataRingkasan;
  logo: string | null; // data URL gambar logo; null = tampil nama usaha saja
}) {
  const bagian = bagianDari(d, true);

  return (
    <Document title={`Ringkasan Pesanan ${d.noPesanan}`} author="DBK Catering Service">
      <Page size="A4" style={s.halaman}>
        <View style={s.isi}>
        <View style={s.kepala}>
          {logo ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- komponen Image milik react-pdf, tidak punya atribut alt
            <Image src={logo} style={s.logo} />
          ) : (
            <Text style={s.namaUsaha}>DBK Catering Service</Text>
          )}
          <View>
            <Text style={s.judulDok}>RINGKASAN PESANAN</Text>
            <Text style={s.nomor}>{d.noPesanan}</Text>
          </View>
        </View>

        {bagian.map((b, i) => (
          <View key={b.judul} style={s.bagian} wrap={false}>
            <View style={s.judulBagian}>
              <View style={s.bulat}>
                <Text style={s.angka}>{i + 1}</Text>
              </View>
              <Text style={s.teksJudul}>{b.judul.toUpperCase()}</Text>
            </View>

            {b.penutup ? (
              <View style={s.isiBagian}>
                {b.catatan ? <Text>{b.catatan}</Text> : null}
                <Text style={{ color: "#525252", marginTop: b.catatan ? 4 : 0 }}>
                  {KALIMAT_PENUTUP}
                </Text>
              </View>
            ) : (
              b.baris.map((r, j) => <BarisPdf key={r.label} r={r} pertama={j === 0} />)
            )}
          </View>
        ))}
        </View>
        {/* Nomor halaman di bagian bawah tiap lembar */}
        <Text
          fixed
          style={s.nomorHalaman}
          render={({ pageNumber, totalPages }) =>
            `${[d.noPesanan, d.nama].filter(Boolean).join(" - ")}  |  Halaman ${pageNumber} dari ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

/* ------------------------------------------------------------------ */
/* Unduh                                                               */
/* ------------------------------------------------------------------ */

// Logo diambil dulu dan diubah jadi data URL. Kalau gagal dimuat,
// PDF tetap dibuat (tanpa gambar logo) dan tidak ikut gagal.
async function muatLogo(src = "/logo-dbk.png"): Promise<string | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;
    return await new Promise<string | null>((selesai) => {
      const baca = new FileReader();
      baca.onload = () => selesai(typeof baca.result === "string" ? baca.result : null);
      baca.onerror = () => selesai(null);
      baca.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const namaFile = (d: DataRingkasan) => {
  const bersih = (t: string) =>
    t
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  const bagian = ["Pesanan", bersih(d.noPesanan), bersih(d.nama)].filter(Boolean);
  return `${bagian.join("-")}.pdf`;
};

/** Membuat PDF dari data ringkasan lalu mengunduhnya. */
export async function unduhPdf(data: DataRingkasan, logo = "/logo-dbk.png") {
  const gambar = await muatLogo(logo);
  const blob = await pdf(<RingkasanPdf data={data} logo={gambar} />).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = namaFile(data);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
