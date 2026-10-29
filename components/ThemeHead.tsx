import { CSS_TEMA, KUNCI, STYLE_ID } from "./tema-css";

// Pasang di <head> app/layout.tsx supaya tema terpasang sebelum halaman tampil (tanpa berkedip).
const skrip = `(function(){try{var t=localStorage.getItem("${KUNCI}");if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var h=document.documentElement;h.classList.remove("dark","light");h.classList.add(t);h.style.colorScheme=t}catch(e){document.documentElement.classList.add("dark")}})()`;

export default function ThemeHead() {
  return (
    <>
      <style id={STYLE_ID} dangerouslySetInnerHTML={{ __html: CSS_TEMA }} />
      <script dangerouslySetInnerHTML={{ __html: skrip }} />
    </>
  );
}