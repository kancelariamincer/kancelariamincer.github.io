/* wersja 32 */
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
  const blokKontaktu = document.querySelector(".kontakt");

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
    let k = ogranicz((gora3 - vh * 0.65) / (vh * 0.3));
    const g = ogranicz((gora3 - vh * 0.4) / (vh * 0.6));
    // otwarte okienko usługi chowa dane kontaktowe tylko wtedy, gdy faktycznie na nie nachodzi
    const okno = document.querySelector(".opis.otwarty");
    if (okno && k > 0) {
      const a = okno.getBoundingClientRect(), c = blokKontaktu.getBoundingClientRect();
      if (a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top) k = 0;
    }
    const gradientKrycie = k === 0 && okno ? 0 : g;   // przy otwartym okienku w rogu chowamy też gradient z rozmyciem
    // krycie ustawiane wprost na elemencie (pewniejsze w Safari na iPadzie niż zmienne CSS)
    blokKontaktu.style.opacity = k.toFixed(3);
    blokKontaktu.style.visibility = k > 0.01 ? "visible" : "hidden";
    root.style.setProperty("--gradient", gradientKrycie.toFixed(3));
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
    [...document.querySelectorAll(".naglowek .linia, #kancelaria .linia"), document.querySelector(".kontakt__wnetrze")]
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

  /* =========================================================
     2b. Pasek menu przy przewijaniu
     Po zjechaniu poniżej nagłówka: smukły pasek u góry ekranu.
     W dół – chowa się, w górę – wraca. Pogrubiona aktualna sekcja.
     ========================================================= */
  const naglowek = document.querySelector(".naglowek");
  const linkiMenu = [...document.querySelectorAll(".menu a")];
  let ostatnieY = window.scrollY;
  let ukryjPoKlikniecie = false;
  let dolNaglowka = 0;

  function aktualizujPasek() {
    const y = window.scrollY;
    const pasek = naglowek.classList.contains("naglowek--pasek");
    if (!pasek) dolNaglowka = naglowek.offsetTop + naglowek.offsetHeight;  // naturalne położenie
    const prog = dolNaglowka + 40;                                        // nagłówek już poza ekranem
    if (!pasek && y > prog) {
      // wejście w tryb paska – startuje schowany, bez mignięcia
      naglowek.classList.add("bez-przejscia", "naglowek--pasek", "naglowek--ukryty");
      void naglowek.offsetWidth;
      naglowek.classList.remove("bez-przejscia");
    } else if (pasek && y <= dolNaglowka && y < ostatnieY) {   // wracamy do góry – zwykły nagłówek
      naglowek.classList.add("bez-przejscia");
      naglowek.classList.remove("naglowek--pasek", "naglowek--ukryty");
      void naglowek.offsetWidth;
      naglowek.classList.remove("bez-przejscia");
    } else if (pasek) {
      if (ukryjPoKlikniecie || y > ostatnieY + 3) naglowek.classList.add("naglowek--ukryty");
      else if (y < ostatnieY - 3) naglowek.classList.remove("naglowek--ukryty");
    }
    ostatnieY = y;
    // pogrubienie aktualnej sekcji
    if (naglowek.classList.contains("naglowek--pasek")) {
      const h = biezacaSekcja();
      linkiMenu.forEach((a) => a.classList.toggle("aktywny", a.getAttribute("href") === h));
    }
  }

  /* bieżący rok w stopce (nie trzeba go zmieniać co roku) */
  function ustawRok() {
    document.querySelectorAll(".rok").forEach((el) => { el.textContent = String(new Date().getFullYear()); });
  }
  ustawRok();

  /* wspólna obsługa przewijania */
  let zaplanowane = false;
  function naPrzewiniecie() {
    if (zaplanowane) return;
    zaplanowane = true;
    requestAnimationFrame(() => { aktualizujKontakt(); sprawdzWejscia(); aktualizujPasek(); zaplanowane = false; });
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
    let blok = dol - gora;
    // "Nasze biura" dostaje tę samą wysokość bloku co "Zakres usług" –
    // dzięki temu oba tytuły lądują dokładnie w tym samym miejscu ekranu
    if (hash === "#kontakt") {
      const [t2, d2] = CELE["#specjalizacje"]();
      let dol2 = 0;
      d2.forEach((el) => { dol2 = Math.max(dol2, el.getBoundingClientRect().bottom + y); });
      blok = dol2 - (goraLiter(t2) + y);
    }
    const margines = blok < vh - 48 ? (vh - blok) / 2 : 24;
    const maks = document.documentElement.scrollHeight - vh;
    return Math.min(maks, Math.max(0, gora - margines));
  }

  let animacja = null;
  function przerwij() { if (animacja) { cancelAnimationFrame(animacja); animacja = null; ukryjPoKlikniecie = false; } }

  function przewin(hash) {
    przerwij();
    const cel = pozycjaCelu(hash);
    const start = window.scrollY;
    const roznica = cel - start;
    if (malyRuch.matches || Math.abs(roznica) < 2) { window.scrollTo(0, cel); return; }
    const t0 = performance.now();
    ukryjPoKlikniecie = true;               // pasek nie zasłania sekcji, do której jedziemy
    function krok(teraz) {
      const t = Math.min(1, (teraz - t0) / CZAS_PRZEWIJANIA);
      window.scrollTo(0, start + roznica * krzywa(t));
      animacja = t < 1 ? requestAnimationFrame(krok) : null;
      if (!animacja) setTimeout(() => { ukryjPoKlikniecie = false; }, 100);
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
     kafla; dolny rząd: do dołu kafla. Wysokość = długość treści.
     Okienko wchodzi na krycie w 0,5 s, a tekst w nim – linijka po linijce.
     ========================================================= */
  const CZAS_OPISU = 100;                 // ms – jedna linijka w okienku
  const ZAKLADKA_OPISU = 0.45 * CZAS_OPISU; // kolejna linijka startuje po 45% czasu poprzedniej
  root.style.setProperty("--czas-opisu", CZAS_OPISU + "ms");

  const kafle = [...document.querySelectorAll(".kafel")];
  let otwarty = null;

  // dzieli akapit na słowa (raz), żeby dało się pokazywać go linijkami
  function podzielNaSlowa(p) {
    if (p.dataset.podzielony) return;
    const slowa = p.textContent.trim().split(/ +/);
    p.textContent = "";
    slowa.forEach((w, i) => {
      const s = document.createElement("span");
      s.className = "slowo";
      s.textContent = w;
      p.appendChild(s);
      if (i < slowa.length - 1) p.appendChild(document.createTextNode(" "));
    });
    p.dataset.podzielony = "1";
  }

  // zwraca listę "linijek" (tablice elementów) w kolejności od góry
  function linijkiOpisu(opis) {
    const linie = [];
    [...(opis.querySelector(".opis__tresc") || opis).children].forEach((el) => {
      if (el.classList.contains("ukryte")) return;
      if (el.tagName === "P") {
        podzielNaSlowa(el);
        let gora = null, biezaca = null;
        el.querySelectorAll(".slowo").forEach((s) => {
          if (s.offsetTop !== gora) { gora = s.offsetTop; biezaca = []; linie.push(biezaca); }
          biezaca.push(s);
        });
      } else if (el.tagName === "UL") {
        el.querySelectorAll("li").forEach((li) => linie.push([li]));
      } else {
        linie.push([el]);
      }
    });
    return linie;
  }

  function animujOpis(opis) {
    if (!animacje) return;
    const linie = linijkiOpisu(opis);
    linie.forEach((elementy, i) => elementy.forEach((el) => {
      el.classList.add("jednostka");
      el.classList.remove("widoczna");
      el.style.setProperty("--opoznienie", Math.round(i * ZAKLADKA_OPISU) + "ms");
    }));
    void opis.offsetWidth;                // wymusza start animacji od zera
    linie.forEach((elementy) => elementy.forEach((el) => el.classList.add("widoczna")));
  }

  // jeśli okienko wystaje poza ekran – delikatnie przewijamy stronę
  function pokazCaleOkienko(opis) {
    if (getComputedStyle(opis).position === "fixed") return;   // telefon: okienko na środku ekranu
    const r = opis.getBoundingClientRect();
    const vh = window.innerHeight, m = 24;
    let dy = 0;
    if (r.height > vh - 2 * m || r.top < m) dy = r.top - m;
    else if (r.bottom > vh - m) dy = r.bottom - (vh - m);
    if (Math.abs(dy) > 1) window.scrollBy({ top: dy, behavior: malyRuch.matches ? "auto" : "smooth" });
  }

  function zamknijOpis() {
    if (!otwarty) return;
    const { kafel, przycisk, opis } = otwarty;
    przycisk.setAttribute("aria-expanded", "false");
    opis.classList.remove("otwarty");
    kafel.classList.remove("kafel--otwarty");
    root.classList.remove("opis-otwarty");
    aktualizujKontakt();
    const doUkrycia = opis;
    setTimeout(() => { if (!doUkrycia.classList.contains("otwarty")) doUkrycia.hidden = true; }, 500);
    otwarty = null;
  }

  function otworzOpis(i) {
    const kafel = kafle[i];
    const przycisk = kafel.querySelector(".kafel__przycisk");
    const opis = kafel.querySelector(".opis");
    zamknijOpis();
    const kol = i % 5, rzad = Math.floor(i / 5);
    opis.style.setProperty("--opis-x", kol <= 2 ? 278 : -490);
    opis.classList.toggle("opis--dol", rzad > 0);
    opis.hidden = false;
    const tresc = opis.querySelector(".opis__tresc");
    tresc.scrollTop = 0;
    zanikOpisu(tresc);
    kafel.classList.add("kafel--otwarty");
    przycisk.setAttribute("aria-expanded", "true");
    root.classList.add("opis-otwarty");
    aktualizujKontakt();
    animujOpis(opis);
    requestAnimationFrame(() => { opis.classList.add("otwarty"); pokazCaleOkienko(opis); });
    otwarty = { kafel, przycisk, opis };
    yPrzyOtwarciu = window.scrollY;
  }

  // dolny zanik tekstu (20 px), gdy treść sięga dolnego marginesu;
  // zmniejsza się do 0 przy dojściu do końca treści
  function zanikOpisu(tresc) {
    const reszta = tresc.scrollHeight - tresc.clientHeight - tresc.scrollTop;
    tresc.style.setProperty("--zanik", Math.max(0, Math.min(20, reszta)).toFixed(1) + "px");
  }
  document.querySelectorAll(".opis__tresc").forEach((t) =>
    t.addEventListener("scroll", () => zanikOpisu(t), { passive: true }));

  kafle.forEach((kafel, i) => {
    kafel.querySelector(".kafel__przycisk").addEventListener("click", (e) => {
      e.stopPropagation();
      if (otwarty && otwarty.kafel === kafel) zamknijOpis(); else otworzOpis(i);
    });
    kafel.querySelector(".opis").addEventListener("click", (e) => e.stopPropagation());
    kafel.querySelector(".opis__zamknij").addEventListener("click", () => { zamknijOpis(); });
  });
  document.addEventListener("click", zamknijOpis);
  // telefon: okienko nie jedzie za przewijaniem strony – przy przewinięciu gaśnie i się zamyka
  let yPrzyOtwarciu = 0;
  window.addEventListener("scroll", () => {
    if (!otwarty || getComputedStyle(otwarty.opis).position !== "fixed") return;
    if (Math.abs(window.scrollY - yPrzyOtwarciu) > 12) zamknijOpis();
  }, { passive: true });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && otwarty) { const p = otwarty.przycisk; zamknijOpis(); p.focus(); }
  });

  /* =========================================================
     4b. Przełącznik PL / ENG
     Przejście do drugiej wersji językowej zachowuje miejsce na stronie
     (ta sama sekcja) i nie odtwarza animacji wejścia (zob. js/start.js).
     ========================================================= */
  function biezacaSekcja() {
    const srodek = window.innerHeight / 2;
    let wynik = "#kancelaria";
    ["#kancelaria", "#specjalizacje", "#kontakt"].forEach((h) => {
      const el = document.querySelector(h);
      if (el && el.getBoundingClientRect().top <= srodek) wynik = h;
    });
    return wynik;
  }
  // po wejściu z przełącznika: od razu w tym samym miejscu, bez animacji
  if (!animacje && location.hash in CELE && document.referrer) {
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      requestAnimationFrame(() => window.scrollTo(0, pozycjaCelu(location.hash)));
    });
  }

  /* =========================================================
     4c. Klauzula RODO – "… rozwiń" rozwija całą treść w miejscu (w dół), "zwiń" ją zwija
     (delegacja – przyciski są podmieniane przy zmianie języka)
     ========================================================= */
  document.addEventListener("click", (e) => {
    const rozwin = e.target.closest(".rodo__rozwin"), zwin = e.target.closest(".rodo__zwin");
    if (!rozwin && !zwin) return;
    const blok = (rozwin || zwin).closest(".formularz__rodo");
    blok.classList.toggle("rodo--rozwiniete", !!rozwin);
    const r = blok.querySelector(".rodo__rozwin");
    if (r) r.setAttribute("aria-expanded", String(!!rozwin));
  });

  /* =========================================================
     4d. Zmiana języka bez przeładowania strony
     Teksty bieżącego języka gasną falą litera po literze (rozrzut 10 liter),
     a gdy fala dojdzie do 7. litery, za nią tą samą falą zapala się tekst
     drugiego języka – przez 3 litery oba się nakładają. Wszystkie bloki naraz.
     Druga wersja jest pobierana z serwera (ta sama witryna) i podmieniana w miejscu.
     ========================================================= */
  const CZAS_ZMIANY = 1000;     // ms – zejście (i osobno wejście) tekstu jednego bloku
  const ROZRZUT = 10;           // ile liter naraz jest w trakcie obrotu
  const ATRYBUTY = ["href", "title", "aria-label", "placeholder", "data-tekst", "alt", "lang", "hreflang", "aria-current", "src", "data-adres", "data-nazwa"];
  let trwaZmiana = false;

  // elementy dodane przez skrypty (mapa Leaflet, podział na słowa/litery) – pomijamy
  const dynamiczny = (el) => !el.classList.contains("mapa") &&
    [...el.classList].some((c) => c.startsWith("leaflet-") || c === "slowo" || c.startsWith("zj-"));
  const dzieci = (el) => [...el.children].filter((c) => !dynamiczny(c));
  const maWlasnyTekst = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());

  function zgodne(a, b) {
    if (a.tagName !== b.tagName) return false;
    const da = dzieci(a), db = dzieci(b);
    if (maWlasnyTekst(b)) return true;           // blok tekstu – treść i tak podmieniamy w całości
    if (da.length !== db.length) return false;
    return da.every((x, i) => zgodne(x, db[i]));
  }

  function paruj(zywy, wzor, bloki) {
    ATRYBUTY.forEach((n) => {
      if (wzor.hasAttribute(n)) { if (zywy.getAttribute(n) !== wzor.getAttribute(n)) zywy.setAttribute(n, wzor.getAttribute(n)); }
      else if (zywy.hasAttribute(n)) zywy.removeAttribute(n);
    });
    if (maWlasnyTekst(wzor)) {
      if (zywy.textContent.replace(/\s+/g, " ").trim() !== wzor.textContent.replace(/\s+/g, " ").trim()) bloki.push([zywy, wzor]);
      return;
    }
    const da = dzieci(zywy), db = dzieci(wzor);
    da.forEach((x, i) => paruj(x, db[i], bloki));
  }

  // owija litery w elementy do animacji; zwraca litery w kolejności czytania
  function rozbijNaLitery(el) {
    const wezly = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) if (w.currentNode.textContent.trim()) wezly.push(w.currentNode);
    const litery = [];
    wezly.forEach((wezel) => {
      // całość tekstu z jednego węzła w jednym elemencie – w kontenerach flex (np. menu)
      // nie rozsypie się na osobne elementy
      const frag = document.createElement("span");
      frag.className = "zj-tekst";
      wezel.textContent.split(/(\s+)/).forEach((kawalek) => {
        if (!kawalek) return;
        if (/^\s+$/.test(kawalek)) { frag.appendChild(document.createTextNode(kawalek)); return; }
        const slowo = document.createElement("span");
        slowo.className = "zj-slowo";
        Array.from(kawalek).forEach((z) => {
          const l = document.createElement("span");
          l.className = "zj-litera";
          l.textContent = z;
          slowo.appendChild(l);
          litery.push(l);
        });
        frag.appendChild(slowo);
      });
      wezel.parentNode.replaceChild(frag, wezel);
    });
    return litery;
  }

  // fala krycia: każda litera gaśnie/zapala się przez czas 10 "kroków" (rozrzut 10 liter),
  // kolejna startuje o 1 krok później
  function rozplanuj(litery, krok, start) {
    litery.forEach((l, i) => {
      l.style.setProperty("--zj-czas", Math.round(krok * ROZRZUT) + "ms");
      l.style.setProperty("--zj-opoznienie", Math.round(start + krok * i) + "ms");
    });
  }

  // gdy kopia z rozbitymi literami wyszła wyższa od oryginału (dodatkowe złamanie linii),
  // poszerzamy ją minimalnie, aż wysokości się zgodzą
  function dopasujSzerokosc(kopia, oryginal) {
    if (kopia.style.position === "absolute" && kopia.style.left.endsWith("px") && getComputedStyle(oryginal).position === "relative") return;
    const cel = oryginal.getBoundingClientRect().height;
    const baza = parseFloat(getComputedStyle(kopia).width) || 0;
    for (let dodatek = 0; dodatek <= 40 && kopia.getBoundingClientRect().height > cel + 0.5; dodatek += 2) {
      kopia.style.width = baza + dodatek + "px";
    }
  }

  function widoczny(el) {
    if (!el.getClientRects().length) return false;
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight && getComputedStyle(el).visibility !== "hidden";
  }

  function podmien(zywy, wzor) {
    zywy.innerHTML = wzor.innerHTML;
    zywy.removeAttribute("data-podzielony");
  }

  async function zmienJezyk(url, doHistorii) {
    if (trwaZmiana) return;
    trwaZmiana = true;
    try {
      const odp = await fetch(url, { credentials: "same-origin" });
      if (!odp.ok) throw new Error("brak strony");
      const nowy = new DOMParser().parseFromString(await odp.text(), "text/html");
      if (nowy.documentElement.lang === root.lang) { trwaZmiana = false; return; }
      if (!zgodne(document.body, nowy.body)) throw new Error("inna struktura");
      zamknijOpis();
      if (doHistorii) history.pushState({ jezyk: nowy.documentElement.lang }, "", url);

      root.lang = nowy.documentElement.lang;
      document.title = nowy.title;
      const opisMeta = document.querySelector('meta[name="description"]');
      const opisNowy = nowy.querySelector('meta[name="description"]');
      if (opisMeta && opisNowy) opisMeta.setAttribute("content", opisNowy.getAttribute("content"));

      const bloki = [];
      paruj(document.body, nowy.body, bloki);

      // Jednostki animacji: najbliższy pozycjonowany blok wokół zmienianego tekstu
      // (nad nim kładziemy kopie – starą i nową – więc oryginał z obsługą kliknięć zostaje nietknięty).
      const jednostka = (el) => {
        let x = el;
        while (x && x !== document.body) {
          const st = getComputedStyle(x);
          if (st.display !== "inline" && st.position !== "static") return x;
          x = x.parentElement;
        }
        return null;
      };
      let jednostki = [];
      bloki.forEach(([zywy]) => {
        if (malyRuch.matches || !widoczny(zywy)) return;
        const j = jednostka(zywy);
        if (j && !jednostki.includes(j)) jednostki.push(j);
      });
      jednostki = jednostki.filter((j) => !jednostki.some((k) => k !== j && k.contains(j)));

      const klonuj = (j) => {
        const k = j.cloneNode(true);
        k.classList.add("zj-klon");
        k.removeAttribute("id");
        k.querySelectorAll("[id]").forEach((x) => x.removeAttribute("id"));
        k.setAttribute("aria-hidden", "true");
        k.classList.remove("zj-ukryty");
        const st = getComputedStyle(j);
        if (st.position === "relative") {
          Object.assign(k.style, { position: "absolute", left: j.offsetLeft + "px", top: j.offsetTop + "px", width: j.offsetWidth + "px", margin: "0" });
        } else {
          // przypinamy kopię dokładnie w miejscu oryginału (niezależnie od reguł typu :nth-of-type)
          Object.assign(k.style, { left: st.left, top: st.top, right: "auto", bottom: "auto", width: st.width });
        }
        return k;
      };
      // kopie ze starym tekstem (przed podmianą)
      const stare = jednostki.map(klonuj);
      // podmiana treści w oryginałach
      bloki.forEach(([zywy, wzor]) => podmien(zywy, wzor));
      const nowe = jednostki.map(klonuj);

      if (jednostki.length) {
        // Nowy tekst rusza, gdy fala gaśnięcia starego dojdzie do 7. litery,
        // więc obie fale idą razem, a przez 3 litery nakładają się na siebie.
        const START_NOWEGO = 7;
        let najdluzej = 0;
        jednostki.forEach((j, i) => {
          j.classList.add("zj-ukryty");
          j.after(stare[i], nowe[i]);
          const ls = rozbijNaLitery(stare[i]), ln = rozbijNaLitery(nowe[i]);
          // kopie nie mogą łamać linii inaczej niż oryginał (inaczej tekst "skacze")
          [stare[i], nowe[i]].forEach((k) => dopasujSzerokosc(k, j));
          const krok = CZAS_ZMIANY / (Math.max(ls.length, ln.length) + ROZRZUT - 1);
          rozplanuj(ls, krok, 0);
          rozplanuj(ln, krok, START_NOWEGO * krok);
          najdluzej = Math.max(najdluzej, START_NOWEGO * krok + CZAS_ZMIANY);
          stare[i].classList.add("zj-out");
          nowe[i].classList.add("zj-in");
        });
        const NAKLADKA = najdluzej - CZAS_ZMIANY;
        setTimeout(() => {
          jednostki.forEach((j, i) => {
            j.classList.add("zj-bez-przejscia");   // oryginał wraca od razu, bez ponownego wygaszania
            j.classList.remove("zj-ukryty");
            void j.offsetWidth;
            stare[i].remove(); nowe[i].remove();
            j.classList.remove("zj-bez-przejscia");
          });
          aktualizujKontakt();
          ustawRok();
          trwaZmiana = false;
        }, NAKLADKA + CZAS_ZMIANY + 60);
      } else {
        ustawRok();
        trwaZmiana = false;
      }
    } catch (blad) {
      window.location.href = url;   // awaryjnie: zwykłe przejście na drugą stronę
    }
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-przelacznik]");
    if (!a) return;
    e.preventDefault();
    if (a.hasAttribute("aria-current")) return;
    zmienJezyk(a.href.split("#")[0], true);
  });
  window.addEventListener("popstate", () => zmienJezyk(location.href.split("#")[0], false));

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
  // kliknięcie adresu: mapa centruje się na biurze (bez mapy – wybór aplikacji map)
  let pokazNaMapie = null;
  document.addEventListener("click", (e) => {
    const a = e.target.closest(".adres[data-adres]");
    if (!a) return;
    e.preventDefault();
    if (pokazNaMapie && pokazNaMapie(a.dataset.adres)) return;
    pokazWybor(a.dataset.adres);
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

    // pinezka: kółko 20 px (wygląd w CSS: .pinezka)
    const ikona = L.divIcon({
      className: "pinezka",
      html: "",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    const granice = [];
    const znaczniki = {};
    BIURA.forEach((b) => {
      const m = L.marker(b.wsp, { icon: ikona, title: b.nazwa, alt: b.nazwa, keyboard: true }).addTo(mapa);
      // podpis z adresem nad pinezką (stały)
      m.bindTooltip(b.nazwa, { permanent: true, direction: "top", offset: [0, -12], className: "podpis-biura" });
      m.on("click", () => pokazWybor(b.adres));
      znaczniki[b.adres] = m;
      granice.push(b.wsp);
    });
    pokazNaMapie = (adres) => {
      const m = znaczniki[adres];
      if (!m) return false;
      const r = elMapy.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) elMapy.scrollIntoView({ behavior: malyRuch.matches ? "auto" : "smooth", block: "center" });
      mapa.flyTo(m.getLatLng(), 16, { duration: malyRuch.matches ? 0 : 1 });
      return true;
    };
    mapa.fitBounds(granice, { paddingTopLeft: [60, 100], paddingBottomRight: [60, 40] });   // miejsce na podpisy nad pinezkami
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
        root.lang === "en"
          ? "The form is not active yet. Please write to kancelaria@adwokat-mincer.com."
          : "Formularz nie jest jeszcze aktywny. Napisz na kancelaria@adwokat-mincer.com.";
    });
  }
})();
