/* =========================================================
   Kancelaria Adwokacka – skrypty strony
   1. Dane kontaktowe i gradient przy przewijaniu
   2. Płynne przewijanie do sekcji (menu)
   3. Wybór aplikacji map (Google / Apple)
   4. Mapa interaktywna (Leaflet + OpenStreetMap)
   5. Formularz (tymczasowo nieaktywny)
   ========================================================= */
(function () {
  "use strict";

  const root = document.documentElement;
  const strona2 = document.getElementById("specjalizacje");
  const strona3 = document.getElementById("kontakt");
  const ogranicz = (v) => Math.min(1, Math.max(0, v));
  const wygladz = (t) => t * t * (3 - 2 * t); // smoothstep
  const malyRuch = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* =========================================================
     1. Dane kontaktowe: duży wariant (strona 1) → mały (strona 2),
        godziny w miejscu; znikanie przed stroną 3; gradient → 0.
     ========================================================= */
  const PROPORCJA = 343 / 497; // szerokość e-maila: mały / duży wariant

  function aktualizuj() {
    const vh = window.innerHeight;
    const y = window.scrollY;

    const start2 = strona2.offsetTop;
    const p = wygladz(ogranicz(y / Math.max(1, start2 - vh * 0.4)));
    root.style.setProperty("--duzy-krycie", ogranicz(1 - p / 0.5).toFixed(3));
    root.style.setProperty("--maly-krycie", ogranicz((p - 0.5) / 0.5).toFixed(3));
    root.style.setProperty("--duzy-skala", (1 - p * (1 - PROPORCJA)).toFixed(4));
    root.style.setProperty("--maly-skala", (1 / PROPORCJA - p * (1 / PROPORCJA - 1)).toFixed(4));

    const gora3 = strona3.getBoundingClientRect().top;
    const k = ogranicz((gora3 - vh * 0.65) / (vh * 0.3));
    const g = ogranicz((gora3 - vh * 0.4) / (vh * 0.6));
    root.style.setProperty("--kontakt", k.toFixed(3));
    root.style.setProperty("--kontakt-widocznosc", k > 0.01 ? "visible" : "hidden");
    root.style.setProperty("--gradient", g.toFixed(3));

    zaplanowane = false;
  }
  let zaplanowane = false;
  function naPrzewiniecie() {
    if (!zaplanowane) { zaplanowane = true; requestAnimationFrame(aktualizuj); }
  }
  window.addEventListener("scroll", naPrzewiniecie, { passive: true });
  window.addEventListener("resize", naPrzewiniecie);
  aktualizuj();

  /* =========================================================
     2. Płynne przewijanie do sekcji
     Sekcja ustawia się tak, by odstęp od górnej krawędzi ekranu
     do tytułu był równy odstępowi od najniższego elementu
     graficznego do dolnej krawędzi ekranu. Tytuły "ZAKRES USŁUG"
     i "NASZE BIURA…" lądują dzięki temu w tym samym miejscu.
     ========================================================= */
  const CZAS_PRZEWIJANIA = 2400;  // ms (ok. 3× dłużej niż standard przeglądarki)
  // krzywa ruchu: łagodny start, bardzo długie wyhamowanie
  const KRZYWA = [0.3, 0.0, 0.0, 1.0];

  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const fx = (t) => ((ax * t + bx) * t + cx) * t;
    const fy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return function (x) {
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = fx(t) - x, d = dx(t);
        if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      let lo = 0, hi = 1;
      t = Math.min(1, Math.max(0, t));
      for (let i = 0; i < 20 && Math.abs(fx(t) - x) > 1e-6; i++) {
        if (fx(t) < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return fy(t);
    };
  }
  const krzywa = bezier.apply(null, KRZYWA);

  // [element tytułu, element(y) wyznaczające dół bloku]
  const CELE = {
    "#kancelaria": null, // góra strony
    "#specjalizacje": () => [document.querySelector(".naglowek-sekcji--uslugi"), document.querySelectorAll(".kafle .ikona")],
    "#kontakt": () => [document.querySelector(".naglowek-sekcji--kontakt"), document.querySelectorAll(".mapa, .przycisk")],
  };

  function pozycjaCelu(hash) {
    const opis = CELE[hash];
    if (!opis) return 0;
    const [tytul, dolne] = opis();
    const y = window.scrollY;
    const vh = window.innerHeight;
    // górna krawędź liter tytułu (pomijamy pusty margines interlinii)
    const rTytul = tytul.getBoundingClientRect();
    const gora = rTytul.top + y + parseFloat(getComputedStyle(tytul).fontSize) * 0.25;
    let dol = 0;
    dolne.forEach((el) => { dol = Math.max(dol, el.getBoundingClientRect().bottom + y); });
    const blok = dol - gora;
    const margines = blok < vh - 48 ? (vh - blok) / 2 : 24; // gdy blok się nie mieści – tytuł 24 px od góry
    const maks = document.documentElement.scrollHeight - vh;
    return Math.min(maks, Math.max(0, gora - margines));
  }

  let animacja = null;
  function przerwij() { if (animacja) { cancelAnimationFrame(animacja); animacja = null; } }

  function przewin(hash) {
    przerwij();
    const cel = pozycjaCelu(hash);
    const start = window.scrollY;
    const roznica = cel - start;
    if (malyRuch.matches || Math.abs(roznica) < 2) { window.scrollTo(0, cel); return; }
    const t0 = performance.now();
    function krok(teraz) {
      const t = Math.min(1, (teraz - t0) / CZAS_PRZEWIJANIA);
      window.scrollTo(0, start + roznica * krzywa(t));
      animacja = t < 1 ? requestAnimationFrame(krok) : null;
    }
    animacja = requestAnimationFrame(krok);
  }

  // użytkownik sam przewija → przerywamy animację
  ["wheel", "touchstart", "keydown", "mousedown"].forEach((typ) =>
    window.addEventListener(typ, przerwij, { passive: true })
  );

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const hash = a.getAttribute("href");
    if (!(hash in CELE)) return;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      // fokus przenosimy na sekcję (dostępność), bez skoku strony
      const sekcja = hash === "#kancelaria" ? document.getElementById("kancelaria") : document.querySelector(hash);
      if (sekcja) { sekcja.setAttribute("tabindex", "-1"); sekcja.focus({ preventScroll: true }); }
      history.pushState(null, "", hash);
      // drobne opóźnienie, by przerwanie przez "mousedown" nie zatrzymało startu
      setTimeout(() => przewin(hash), 0);
    });
  });

  /* =========================================================
     3. Wybór aplikacji map
     ========================================================= */
  const okno = document.getElementById("wybor-mapy");
  function linkGoogle(adres) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(adres);
  }
  function linkApple(adres) {
    return "https://maps.apple.com/?q=" + encodeURIComponent(adres);
  }
  function pokazWybor(adres) {
    if (!okno || typeof okno.showModal !== "function") {
      window.open(linkGoogle(adres), "_blank", "noopener");
      return;
    }
    okno.querySelector(".wybor-mapy__adres").textContent = adres;
    okno.querySelector('[data-mapy="google"]').href = linkGoogle(adres);
    okno.querySelector('[data-mapy="apple"]').href = linkApple(adres);
    okno.showModal();
  }
  if (okno) {
    okno.querySelector(".wybor-mapy__anuluj").addEventListener("click", () => okno.close());
    okno.querySelectorAll(".wybor-mapy__opcja").forEach((a) => a.addEventListener("click", () => okno.close()));
    okno.addEventListener("click", (e) => { if (e.target === okno) okno.close(); }); // klik w tło
  }
  document.querySelectorAll(".adres[data-adres]").forEach((a) => {
    a.addEventListener("click", (e) => { e.preventDefault(); pokazWybor(a.dataset.adres); });
  });

  /* =========================================================
     4. Mapa (Leaflet + OpenStreetMap)
     Przesuwanie jednym palcem, powiększanie rozsuwaniem dwóch palców.
     Kółko myszy nie powiększa mapy (żeby nie blokować przewijania
     strony) – na komputerze służą do tego przyciski +/– i dwuklik.
     ========================================================= */
  const BIURA = [
    // UWAGA: współrzędne przybliżone – do sprawdzenia
    { adres: "ul. Świętej Anny 9, Kraków", nazwa: "ul. Świętej Anny 9", wsp: [50.06205, 19.93445] },
    { adres: "ul. Urzędnicza 20, Kraków", nazwa: "ul. Urzędnicza 20/8", wsp: [50.07000, 19.92130] },
  ];
  const elMapy = document.getElementById("mapa");
  if (elMapy && window.L) {
    elMapy.classList.add("mapa--aktywna");
    const mapa = L.map(elMapy, {
      scrollWheelZoom: false,
      dragging: true,
      touchZoom: true,
      tap: true,
      zoomSnap: 0.5,
      attributionControl: true,
    });
    mapa.attributionControl.setPrefix(false);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      minZoom: 11,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(mapa);

    const ikona = L.divIcon({
      className: "pinezka",
      html: '<svg viewBox="0 0 24 34" aria-hidden="true"><path fill="#E53935" d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 34 12 34s12-13.2 12-22.1C24 5.3 18.6 0 12 0z"/><circle cx="12" cy="12" r="4.2" fill="#8E1B18"/></svg>',
      iconSize: [28, 40],
      iconAnchor: [14, 40],
    });
    const granice = [];
    BIURA.forEach((b) => {
      const m = L.marker(b.wsp, { icon: ikona, title: b.nazwa, alt: b.nazwa, keyboard: true }).addTo(mapa);
      m.on("click", () => pokazWybor(b.adres));
      granice.push(b.wsp);
    });
    mapa.fitBounds(granice, { padding: [60, 60] });
    window.addEventListener("resize", () => mapa.invalidateSize());
  }

  /* =========================================================
     5. Formularz (do czasu podłączenia usługi wysyłki)
     ========================================================= */
  const formularz = document.getElementById("formularz");
  if (formularz && formularz.getAttribute("action") === "#") {
    formularz.addEventListener("submit", function (e) {
      e.preventDefault();
      formularz.querySelector(".formularz__status").textContent =
        "Formularz nie jest jeszcze aktywny. Napisz na kancelaria@adwokat-mincer.com.";
    });
  }
})();
