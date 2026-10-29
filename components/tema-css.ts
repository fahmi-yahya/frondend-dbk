// Dipakai ThemeProvider (client) dan ThemeHead (server), jadi file ini tanpa "use client".

export const KUNCI = "dapur-nusa:tema";
export const EVENT_TEMA = "dapur-nusa:tema-berubah";
export const STYLE_ID = "dapur-nusa-tema";

/*
  Palet warna dua tema.
  - html.dark  : warna asli (semua class gelap di halaman sudah pas, jadi tidak ada yang diubah)
  - html.light : variabel diganti + class gelap yang umum dipakai ditimpa ke versi terang
  Kertas nota/ringkasan (bg-white, text-neutral-900, dst.) sengaja tidak ditimpa:
  kertas selalu putih di kedua tema, sama seperti hasil cetaknya.
*/
export const CSS_TEMA = String.raw`
html.dark {
  color-scheme: dark;
  --bg-base: #0c0c0c; --bg-surface: #141414; --bg-surface2: #1c1c1c; --bg-muted: #262626;
  --border: rgba(255,255,255,.1); --border-strong: rgba(255,255,255,.25);
  --text-base: #f5f5f5; --text-muted: #a3a3a3; --text-sidebar: #e5e5e5;
}
html.light {
  color-scheme: light;
  --bg-base: #f4f4f5; --bg-surface: #ffffff; --bg-surface2: #f4f4f5; --bg-muted: #ececee;
  --border: rgba(0,0,0,.1); --border-strong: rgba(0,0,0,.25);
  --text-base: #18181b; --text-muted: #6b6b73; --text-sidebar: #27272a;

  /* permukaan */
  .bg-\[\#141414\] { background-color: #fff; }
  .bg-\[\#1c1c1c\], .bg-\[\#1b1b1b\] { background-color: #f4f4f5; }
  .bg-white\/5, .bg-white\/\[0\.04\], .hover\:bg-white\/5:hover,
  .focus-visible\:bg-white\/5:focus-visible { background-color: rgba(0,0,0,.04); }
  .bg-white\/10, .bg-white\/15, .hover\:bg-white\/10:hover { background-color: rgba(0,0,0,.07); }
  .bg-neutral-700 { background-color: #e4e4e7; }
  .bg-neutral-900:not(.text-white) { background-color: #fff; color: #18181b; }
  .bg-white.text-black { background-color: #18181b; color: #fff; }
  .hover\:bg-neutral-200:hover { background-color: #3f3f46; }

  /* garis */
  .border-white\/10, .divide-white\/10 > :not(:last-child) { border-color: rgba(0,0,0,.1); }
  .border-white\/5, .divide-white\/5 > :not(:last-child) { border-color: rgba(0,0,0,.06); }
  .border-white\/20, .border-white\/25, .border-white\/30,
  .hover\:border-white\/25:hover { border-color: rgba(0,0,0,.25); }
  .border-white { border-color: #18181b; }
  .shadow-\[inset_0_-2px_0_0_white\] { box-shadow: inset 0 -2px 0 0 #18181b; }

  /* teks */
  .text-neutral-100, .text-neutral-200 { color: #18181b; }
  .text-neutral-300, .hover\:text-neutral-300:hover, .hover\:text-neutral-200:hover { color: #3f3f46; }
  .text-neutral-400 { color: #6b6b73; }
  .text-white:not(.bg-neutral-900):not(.bg-orange-500), .hover\:text-white:hover { color: #18181b; }
  .text-orange-300, .text-orange-400, .hover\:text-orange-400:hover { color: #c2410c; }
  .text-indigo-300 { color: #4f46e5; }
  .text-red-400 { color: #dc2626; }
  .text-green-400 { color: #15803d; }
  .text-amber-400 { color: #b45309; }

  /* grafik & kontrol bawaan browser */
  .from-white { --tw-gradient-from: #fed7aa; }
  .from-neutral-700 { --tw-gradient-from: #d4d4d8; }
  .to-neutral-800 { --tw-gradient-to: #a1a1aa; }
  .\[color-scheme\:dark\] { color-scheme: light; }
}
html.dark .logo-gelap { display: none; }
html.light .logo-terang { display: none; }
`;
