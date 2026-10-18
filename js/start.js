/* Włącza animacje wejścia (jeśli użytkownik nie wyłączył animacji w systemie).
   Bez JavaScriptu cała treść jest od razu widoczna – ważne dla Google i modeli AI. */
if (!window.matchMedia || !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("anim");
}
