"use client";

import { useEffect, useSyncExternalStore } from "react";
import { CSS_TEMA, EVENT_TEMA, KUNCI, STYLE_ID } from "./tema-css";

export type Theme = "dark" | "light";

const GELAP = "(prefers-color-scheme: dark)";

function langganan(onChange: () => void) {
  const mq = window.matchMedia(GELAP);
  window.addEventListener("storage", onChange); // tab lain
  window.addEventListener(EVENT_TEMA, onChange); // tab ini
  mq.addEventListener("change", onChange); // ikut pengaturan sistem
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT_TEMA, onChange);
    mq.removeEventListener("change", onChange);
  };
}

function baca(): Theme {
  try {
    const t = localStorage.getItem(KUNCI);
    if (t === "dark" || t === "light") return t;
    return window.matchMedia(GELAP).matches ? "dark" : "light";
  } catch {
    return "dark";
  }
}

// Server selalu "dark"; nilai asli dipakai setelah halaman tampil di browser
const bacaServer = (): Theme => "dark";

// Pasang class di <html> dan palet warna (jika belum dipasang oleh <ThemeHead />)
function terapkan(tema: Theme) {
  const html = document.documentElement;
  html.classList.remove("dark", "light");
  html.classList.add(tema);
  html.style.colorScheme = tema;
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS_TEMA;
    document.head.appendChild(s);
  }
}

function simpan(tema: Theme) {
  try {
    localStorage.setItem(KUNCI, tema);
  } catch {
    /* penyimpanan dinonaktifkan: tema tetap berganti untuk sesi ini */
  }
  terapkan(tema);
  window.dispatchEvent(new Event(EVENT_TEMA));
}

/**
 * Bisa dipakai di komponen mana pun, tidak wajib dibungkus <ThemeProvider>.
 * const { tema, toggleTema } = useTheme();
 */
export function useTheme() {
  const tema = useSyncExternalStore(langganan, baca, bacaServer);
  useEffect(() => terapkan(tema), [tema]);
  return { tema, toggleTema: () => simpan(tema === "dark" ? "light" : "dark") };
}

// Dipertahankan supaya import lama tetap jalan
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}
