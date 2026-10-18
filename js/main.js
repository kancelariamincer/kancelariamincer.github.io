/* wersja 4 */
/* =========================================================
   Kancelaria Adwokacka – skrypty strony
   1. Dane kontaktowe i gradient przy przewijaniu
   2. Animacje wejścia: linijki tekstu + odsłanianie zdjęć
   3. Płynne przewijanie do sekcji (menu)
   4. Okienka z opisem usług
   5. Wybór aplikacji map (Google / Apple)
   6. Mapa interaktywna (Leaflet + OpenStreetMap)
   7. Formularz (tymczasowo nieaktywny)
   ========================================================= */
(function () {
  "use strict";

  const root = document.documentElement;
  const strona2 = document.getElementById("specjalizacje");
  const strona3 = document.getElementById("kontakt");
  const ogranicz = (v) => Math.min(1, Math.max(0, v));
  const wygladz = (t) => t * t * (3 - 2 * t); // smoothstep
  const malyRuch = window.matchMedia("(prefers-reduced-motion: reduce)");
  const animacje = root.classList.contains("anim");

  /* =========================================================
     1. Dane kontaktowe: duży wariant (strona 1) → mały (strona 2),
        godziny w miejscu; znikanie przed stroną 3; gradient → 0.
     ========================================================= */
  const PROPORCJA = 343 / 497; // szerokość e-maila: mały / duży wariant

  function aktualizujKontakt() {
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
  }

  /* =========================================================
     2. Animacje wejścia
     a) Linijki tekstu i elementy wchodzą na krycie (opacity),
        każda kolejna startuje po 15% czasu poprzedniej – zazębiają się.
     b) Zdjęcia w tle odsłania przesuwający się gradient,
        którego strefa przejścia ma 1/3 wysokości ekranu.
     ========================================================= */
  const CZAS_LINII = 900;               // ms – czas pojawiania się jednej linijki
  const ZAKLADKA = 0.15 * CZAS_LINII;   // 15% → kolejna linijka startuje po 135 ms

  // grupy: [elementy-kontenery, linijki w kolejności czytania]
  const grupy = [];
  function dodajGrupe(kontenery, linie) {
    grupy.push({ kontenery, linie, pokazana: false });
  }
  dodajGrupe(
    [document.querySelector(".naglowek"), document.getElementById("kancelaria")],
    [...document.querySelectorAll(".naglowek .linia, #kancelaria .linia, .kontakt .linia")]
  );
  document.querySelectorAll(".sekcja--uslugi, .sekcja--kontakt, .stopka").forEach((el) =>
    dodajGrupe([el], [...el.querySelectorAll(".linia")])
  );
  root.style.setProperty("--czas-linii", CZAS_LINII + "ms");

  function pokazGrupe(gr, natychmiast) {
    if (gr.pokazana) return;
    gr.pokazana = true;
    gr.linie.forEach((el, i) => {
      if (natychmiast) el.classList.add("bez-animacji");
      else el.style.setProperty("--opoznienie", Math.round(i * ZAKLADKA) + "ms");
      el.classList.add("widoczna");
    });
  }

  // tło
  const tla = document.querySelector(".tla");
  let krawedz = 0, celKrawedzi = 0, animTla = null;
  function ustawTlo() {
    const pas = window.innerHeight / 3;
    tla.style.setProperty("--pas", pas.toFixed(0) + "px");
    tla.style.setProperty("--odkryj", krawedz.toFixed(1) + "px");
  }
  function krokTla() {
    const roznica = celKrawedzi - krawedz;
    if (Math.abs(roznica) < 0.5) { krawedz = celKrawedzi; ustawTlo(); animTla = null; return; }
    krawedz += roznica * 0.045;          // płynne doganianie celu (ok. 1,5 s)
    ustawTlo();
    animTla = requestAnimationFrame(krokTla);
  }
  function odslonDo(y, natychmiast) {
    if (y <= celKrawedzi) return;
    celKrawedzi = y;
    if (natychmiast) { krawedz = Math.max(krawedz, y); ustawTlo(); }
    if (!animTla) animTla = requestAnimationFrame(krokTla);
  }

  function sprawdzWejscia() {
    if (!animacje) return;
    const vh = window.innerHeight;
    grupy.forEach((gr) => {
      if (gr.pokazana) return;
      const r = gr.kontenery[0].getBoundingClientRect();
      if (r.bottom < 0) pokazGrupe(gr, true);          // już przewinięta – bez animacji
      else if (r.top < vh * 0.8) pokazGrupe(gr, false); // wjeżdża na ekran
    });
    odslonDo(window.scrollY + vh + vh / 3, false);
  }

  if (animacje) {
    krawedz = window.scrollY;           // zaczynamy od górnej krawędzi ekranu
    ustawTlo();
  } else {
    grupy.forEach((gr) => pokazGrupe(gr, true));
  }

  /* wspólna obsługa przewijania */
  let zaplanowane = false;
  function naPrzewiniecie() {
    if (zaplanowane) return;
    zaplanowane = true;
    requestAnimationFrame(() => { aktualizujKontakt(); sprawdzWejscia(); zaplanowane = false; });
  }
  window.addEventListener("scroll", naPrzewiniecie, { passive: true });
  window.addEventListener("resize", naPrzewiniecie);
  aktualizujKontakt();
  // start: strona 1 buduje się po wczytaniu czcionek
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    requestAnimationFrame(() => {
      if (animacje && window.scrollY < window.innerHeight) pokazGrupe(grupy[0], false);
      sprawdzWejscia();
    });
  });

  /* =========================================================
     3. Płynne przewijanie do sekcji
     Odstęp od górnej krawędzi ekranu do tytułu = odstęp od dolnej
     krawędzi bloku do dolnej krawędzi ekranu. Oba tytuły ("ZAKRES USŁUG"
     i "NASZE BIURA…") lądują dzięki temu w tym samym miejscu.
     ========================================================= */
  const CZAS_PRZEWIJANIA = 2400;
  const KRZYWA = [0.3, 0.0, 0.0, 1.0];   // łagodny start, bardzo długie wyhamowanie

  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const fx = (t) => ((ax * t + bx) * t + cx) * t;
    const fy = (t) => ((ay * t + by) * t + cy) * t;
    return function (x) {
      let lo = 0, hi = 1, t = x;
      for (let i = 0; i < 30; i++) {
        const v = fx(t);
        if (Math.abs(v - x) < 1e-6) break;
        if (v < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return fy(t);
    };
  }
  const krzywa = bezier.apply(null, KRZYWA);

  // górna krawędź liter tytułu (bez pustego miejsca nad literami)
  function goraLiter(el) {
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    const c = document.createElement("canvas").getContext("2d");
    c.font = st.fontSize + " " + st.fontFamily;
    const m = c.measureText(el.textContent.trim());
    const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
    return r.top + (r.height - (asc + desc)) / 2 + (asc - m.actualBoundingBoxAscent);
  }

  const CELE = {
    "#kancelaria": null,
    "#specjalizacje": () => [document.querySelector(".naglowek-sekcji--uslugi"), document.querySelectorAll(".kafle")],
    "#kontakt": () => [document.querySelector(".naglowek-sekcji--kontakt"), document.querySelectorAll(".mapa, .przycisk")],
  };

  function pozycjaCelu(hash) {
    const opis = CELE[hash];
    if (!opis) return 0;
    const [tytul, dolne] = opis();
    const y = window.scrollY;
    const vh = window.innerHeight;
    const gora = goraLiter(tytul) + y;
    let dol = 0;
    dolne.forEach((el) => { dol = Math.max(dol, el.getBoundingClientRect().bottom + y); });
    const blok = dol - gora;
    const margines = blok < vh - 48 ? (vh - blok) / 2 : 24;
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

  ["wheel", "touchstart", "keydown", "mousedown"].forEach((typ) =>
    window.addEventListener(typ, przerwij, { passive: true })
  );

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const hash = a.getAttribute("href");
    if (!(hash in CELE)) return;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const sekcja = document.querySelector(hash);
      if (sekcja) { sekcja.setAttribute("tabindex", "-1"); sekcja.focus({ preventScroll: true }); }
      history.pushState(null, "", hash);
      // Przy skoku do kontaktu strona z usługami jest już w pełni gotowa,
      // a animuje się dopiero strona kontaktowa.
      if (hash === "#kontakt" && animacje) {
        pokazGrupe(grupy[1], true);
        odslonDo(strona3.offsetTop, true);
      }
      setTimeout(() => przewin(hash), 0);
    });
  });

  /* =========================================================
     4. Okienka z opisem usług
     Pojawiają się obok klikniętego kafla (po prawej, a przy dwóch
     ostatnich kolumnach – po lewej). Górny rząd: wyrównane do góry
     kafla; dolny rząd: wyrównane do dołu kafla.
     ========================================================= */
  const kafle = [...document.querySelectorAll(".kafel")];
  let otwarty = null;

  function zamknijOpis() {
    if (!otwarty) return;
    const { kafel, przycisk, opis } = otwarty;
    przycisk.setAttribute("aria-expanded", "false");
    opis.classList.remove("otwarty");
    kafel.classList.remove("kafel--otwarty");
    root.classList.remove("opis-otwarty");
    const doUkrycia = opis;
    setTimeout(() => { if (!doUkrycia.classList.contains("otwarty")) doUkrycia.hidden = true; }, 250);
    otwarty = null;
  }

  function otworzOpis(i) {
    const kafel = kafle[i];
    const przycisk = kafel.querySelector(".kafel__przycisk");
    const opis = kafel.querySelector(".opis");
    zamknijOpis();
    const kol = i % 5, rzad = Math.floor(i / 5);
    opis.style.setProperty("--opis-x", kol <= 2 ? 278 : -490);
    opis.style.setProperty("--opis-y", rzad === 0 ? 0 : 260 - 470);
    opis.hidden = false;
    opis.scrollTop = 0;
    kafel.classList.add("kafel--otwarty");
    przycisk.setAttribute("aria-expanded", "true");
    root.classList.add("opis-otwarty");
    requestAnimationFrame(() => opis.classList.add("otwarty"));
    otwarty = { kafel, przycisk, opis };
  }

  kafle.forEach((kafel, i) => {
    kafel.querySelector(".kafel__przycisk").addEventListener("click", (e) => {
      e.stopPropagation();
      if (otwarty && otwarty.kafel === kafel) zamknijOpis(); else otworzOpis(i);
    });
    kafel.querySelector(".opis").addEventListener("click", (e) => e.stopPropagation());
  });
  document.addEventListener("click", zamknijOpis);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && otwarty) { const p = otwarty.przycisk; zamknijOpis(); p.focus(); }
  });

  /* =========================================================
     5. Wybór aplikacji map
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
     6. Mapa (Leaflet + OpenStreetMap)
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
     7. Formularz (do czasu podłączenia usługi wysyłki)
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
