/* =========================================================
   Zachowanie przy przewijaniu:
   1. Dane kontaktowe: na stronie 1 duży wariant (szeryfowy),
      przy przewijaniu do strony 2 płynnie zmieniają się
      w mały wariant. Godziny "od 9:00 — 17:00" stoją w miejscu.
   2. Przed dojściem do strony 3 (kontakt) dane znikają.
   3. Gradient pod danymi znika (opacity → 0) przy wejściu na stronę 3.
   ========================================================= */
(function () {
  const root = document.documentElement;
  const strona2 = document.getElementById("specjalizacje");
  const strona3 = document.getElementById("kontakt");

  // Proporcja wielkości wariantów (szerokość adresu e-mail): 343 / 497
  const PROPORCJA = 343 / 497;

  const ogranicz = (v) => Math.min(1, Math.max(0, v));
  const wygladz = (t) => t * t * (3 - 2 * t); // smoothstep

  function aktualizuj() {
    const vh = window.innerHeight;
    const y = window.scrollY;

    // --- 1. Zmiana wariantu: od góry strony do momentu, gdy strona 2 dochodzi do 40% ekranu
    const start2 = strona2.offsetTop;
    const p = wygladz(ogranicz(y / Math.max(1, start2 - vh * 0.4)));

    root.style.setProperty("--duzy-krycie", ogranicz(1 - p / 0.5).toFixed(3));
    root.style.setProperty("--maly-krycie", ogranicz((p - 0.5) / 0.5).toFixed(3));
    root.style.setProperty("--duzy-skala", (1 - p * (1 - PROPORCJA)).toFixed(4));
    root.style.setProperty("--maly-skala", (1 / PROPORCJA - p * (1 / PROPORCJA - 1)).toFixed(4));

    // --- 2. i 3. Znikanie przy stronie 3
    const gora3 = strona3.getBoundingClientRect().top;
    // dane kontaktowe: znikają, gdy strona 3 wjeżdża od 95% do 65% wysokości ekranu
    const k = ogranicz((gora3 - vh * 0.65) / (vh * 0.3));
    // gradient: schodzi do 0, gdy strona 3 wjeżdża od 100% do 40% wysokości ekranu
    const g = ogranicz((gora3 - vh * 0.4) / (vh * 0.6));

    root.style.setProperty("--kontakt", k.toFixed(3));
    root.style.setProperty("--kontakt-widocznosc", k > 0.01 ? "visible" : "hidden");
    root.style.setProperty("--gradient", g.toFixed(3));

    zaplanowane = false;
  }

  let zaplanowane = false;
  function naPrzewiniecie() {
    if (!zaplanowane) {
      zaplanowane = true;
      requestAnimationFrame(aktualizuj);
    }
  }

  window.addEventListener("scroll", naPrzewiniecie, { passive: true });
  window.addEventListener("resize", naPrzewiniecie);
  aktualizuj();

  /* ---------- Formularz (do czasu podłączenia usługi wysyłki) ---------- */
  const formularz = document.getElementById("formularz");
  if (formularz && formularz.getAttribute("action") === "#") {
    formularz.addEventListener("submit", function (e) {
      e.preventDefault();
      formularz.querySelector(".formularz__status").textContent =
        "Formularz nie jest jeszcze aktywny. Napisz na kancelaria@adwokat-mincer.com.";
    });
  }
})();
