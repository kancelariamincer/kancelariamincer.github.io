/* wersja 25 */
/* =========================================================
   Blog kancelarii
   1. Pasek menu przy przewijaniu (jak na stronie głównej)
   2. Wyszukiwarka, słowa kluczowe i strony 1, 2, 3…
   3. Rozwijanie kafla we wpis (i zwijanie przyciskiem ×)
   4. Bieżący rok w stopce
   ========================================================= */
(function () {
  "use strict";

  const malyRuch = window.matchMedia("(prefers-reduced-motion: reduce)");
  const NA_STRONE = 6;

  /* ---------- 1. Pasek menu ---------- */
  const naglowek = document.querySelector(".naglowek");
  let ostatnieY = window.scrollY, dolNaglowka = 0;
  function aktualizujPasek() {
    const y = window.scrollY;
    const pasek = naglowek.classList.contains("naglowek--pasek");
    if (!pasek) dolNaglowka = naglowek.offsetTop + naglowek.offsetHeight;
    if (!pasek && y > dolNaglowka + 40) {
      naglowek.classList.add("bez-przejscia", "naglowek--pasek", "naglowek--ukryty");
      void naglowek.offsetWidth;
      naglowek.classList.remove("bez-przejscia");
    } else if (pasek && y <= dolNaglowka && y < ostatnieY) {
      naglowek.classList.add("bez-przejscia");
      naglowek.classList.remove("naglowek--pasek", "naglowek--ukryty");
      void naglowek.offsetWidth;
      naglowek.classList.remove("bez-przejscia");
    } else if (pasek) {
      if (y > ostatnieY + 3) naglowek.classList.add("naglowek--ukryty");
      else if (y < ostatnieY - 3) naglowek.classList.remove("naglowek--ukryty");
    }
    ostatnieY = y;
  }
  let zaplanowane = false;
  window.addEventListener("scroll", () => {
    if (zaplanowane) return;
    zaplanowane = true;
    requestAnimationFrame(() => { aktualizujPasek(); zaplanowane = false; });
  }, { passive: true });

  /* ---------- 2. Wyszukiwarka, słowa kluczowe, strony ---------- */
  const uklad = document.querySelector(".blog-uklad");
  const obszar = document.querySelector(".blog-karty-obszar");
  const karty = [...document.querySelectorAll(".karta")];
  const pole = document.getElementById("blog-szukaj");
  const tagi = [...document.querySelectorAll(".blog-tagi button")];
  const stronyEl = document.querySelector(".blog-strony");
  const brak = document.querySelector(".blog-brak");
  let strona = 1;

  const normalizuj = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l");

  let tagAktywny = null;   // kliknięte słowo kluczowe: wpisy oznaczone tym słowem
  function pasujace() {
    if (tagAktywny) return karty.filter((k) => k.dataset.tagi.split("|").includes(tagAktywny));
    const slowa = normalizuj(pole.value.trim()).split(/\s+/).filter(Boolean);
    return karty.filter((k) => slowa.every((s) => k.dataset.szukaj.includes(s)));
  }

  function pokazKarty() {
    const lista = pasujace();
    const ileStron = Math.max(1, Math.ceil(lista.length / NA_STRONE));
    strona = Math.min(strona, ileStron);
    karty.forEach((k) => { k.hidden = true; });
    lista.slice((strona - 1) * NA_STRONE, strona * NA_STRONE).forEach((k) => { k.hidden = false; });
    brak.hidden = lista.length > 0;
    stronyEl.innerHTML = "";
    if (ileStron > 1) {
      for (let i = 1; i <= ileStron; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = String(i);
        b.setAttribute("aria-label", "Strona " + i);
        if (i === strona) b.setAttribute("aria-current", "page");
        b.addEventListener("click", () => {
          strona = i;
          zamknij(false);
          pokazKarty();
          przewinDo(obszar);
        });
        stronyEl.appendChild(b);
      }
    }
  }

  function filtruj() {
    zamknij(false);
    strona = 1;
    tagi.forEach((t) => t.setAttribute("aria-pressed", String(t.textContent === tagAktywny)));
    pokazKarty();
  }
  pole.addEventListener("input", () => { tagAktywny = null; filtruj(); });
  tagi.forEach((t) => t.addEventListener("click", () => {
    const aktywny = tagAktywny === t.textContent;
    tagAktywny = aktywny ? null : t.textContent;
    pole.value = tagAktywny || "";
    filtruj();
  }));

  function przewinDo(el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 40;
    if (Math.abs(window.scrollY - y) > 2 && window.scrollY > y) {
      window.scrollTo({ top: y, behavior: malyRuch.matches ? "auto" : "smooth" });
    }
  }

  /* ---------- 3. Rozwijanie kafla we wpis ----------
     Otwieranie: przyciemnienie kafla gaśnie (0,3 s), potem kafel rośnie do pełnego wpisu,
     a spod jego dolnej krawędzi wyjeżdża biały gradient (3 s, wyhamowanie). Teksty wpisu
     pojawiają się kolejno już w trakcie. Wszystko maskowane przez kafel.
     Zamykanie: odwrotnie. Pozostałe kafle cały czas leżą pod spodem (bez błyskania). */
  const CZAS = 700, WYGASZENIE = 0, BIEL = 750;   // biel wchodzi od razu i szybko
  const KRZYWA = "cubic-bezier(0.2, 0.7, 0.1, 1)";
  const indeksBloga = document.body.dataset.indeks || "./";
  let otwarty = null, trwa = null;

  function prostokat(el) {
    const a = obszar.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { left: r.left - a.left, top: r.top - a.top, width: r.width, height: r.height };
  }
  const px = (r) => ({ left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });

  function linieWpisu(wpis) {
    const el = [wpis.querySelector(".wpis__data"), wpis.querySelector(".wpis__zamknij"), wpis.querySelector(".wpis__tytul"), wpis.querySelector(".wpis__lead")];
    wpis.querySelectorAll(".wpis__tresc > *").forEach((x) => {
      if (x.tagName === "UL" || x.tagName === "OL") el.push(...x.children); else el.push(x);
    });
    el.push(wpis.querySelector(".wpis__autor"));
    return el;
  }
  function pokazTeksty(wpis, start) {
    linieWpisu(wpis).forEach((el, i) => {
      el.classList.add("wpis-linia");
      el.style.setProperty("--opoznienie", Math.round(start + Math.min(i, 30) * 70) + "ms");
    });
    void wpis.offsetWidth;
    wpis.classList.remove("wpis--teksty-ukryte");
  }

  function otworz(slug, animacja, doHistorii) {
    const wpis = document.getElementById("wpis-" + slug);
    if (!wpis || otwarty === wpis) return;
    zamknij(false);
    const karta = karty.find((k) => k.dataset.slug === slug);
    const ruch = animacja && !malyRuch.matches;
    wpis.hidden = false;
    wpis.classList.add("wpis--teksty-ukryte");
    linieWpisu(wpis).forEach((el) => el.classList.add("wpis-linia"));
    const cel = { left: 0, top: 0, width: wpis.offsetWidth, height: wpis.offsetHeight };
    obszar.style.minHeight = cel.height + "px";
    uklad.classList.add("wpis-otwarty");
    otwarty = wpis;
    if (doHistorii) history.pushState({ wpis: slug }, "", slug + ".html");
    document.title = wpis.dataset.tytul + " – Blog kancelarii";

    if (ruch && karta && !karta.hidden) {
      const start = prostokat(karta);
      wpis.classList.add("wpis--start");                 // przyciemnienie 100%, biel schowana pod kaflem
      Object.assign(wpis.style, px(start));
      przewinDo(obszar);
      void wpis.offsetWidth;
      wpis.querySelector(".wpis__ciemne").style.opacity = "0";   // 1) przyciemnienie gaśnie
      trwa = setTimeout(() => {
        // 2) kafel rośnie, biel wyjeżdża spod spodu, teksty wchodzą
        const a = wpis.animate([px(start), px(cel)], { duration: CZAS, easing: KRZYWA, fill: "forwards" });
        a.onfinish = () => { a.cancel(); wpis.style.cssText = ""; };
        wpis.style.cssText = "";
        wpis.classList.remove("wpis--start");
        wpis.querySelector(".wpis__ciemne").style.opacity = "";
        const biel = wpis.querySelector(".wpis__biel");
        if (true) {   // biel startuje tuż pod dolną krawędzią kafla (komputer i telefon)
          // telefon: biel startuje tuż pod dolną krawędzią kafla i płynnie wsuwa się
          // (przesunięcie + rozciąganie w pionie + krycie), zamiast "wskakiwać" z daleka
          const d = Math.max(0, start.height - biel.offsetTop);
          biel.style.transformOrigin = "top";
          biel.animate(
            [{ transform: `translateY(${d}px) scaleY(0.3)`, opacity: 0 },
             { transform: `translateY(${d * 0.4}px) scaleY(0.75)`, opacity: 1, offset: 0.35 },
             { transform: "translateY(0) scaleY(1)", opacity: 1 }],
            { duration: BIEL, easing: "cubic-bezier(0.2, 0, 0.1, 1)" });
        } else {
          biel.animate(
            [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }],
            { duration: BIEL, easing: "cubic-bezier(0, 0, 0.2, 1)" });
        }
        pokazTeksty(wpis, 150);
      }, WYGASZENIE);
    } else {
      pokazTeksty(wpis, 300);           // np. wejście prosto na adres wpisu – teksty wchodzą kolejno
    }
  }

  function zamknij(animacja, doHistorii) {
    const wpis = otwarty;
    if (!wpis) return;
    otwarty = null;
    clearTimeout(trwa);
    const karta = karty.find((k) => k.dataset.slug === wpis.dataset.slug);
    const koniec = () => {
      if (document.activeElement && wpis.contains(document.activeElement) || document.activeElement && document.activeElement.closest && document.activeElement.closest(".karta")) document.activeElement.blur();
      wpis.hidden = true;
      wpis.style.cssText = "";
      // tekst na kaflu wraca łagodnie (0,5 s), a nie nagle
      if (karta && !malyRuch.matches) karta.querySelectorAll(".karta__data, .karta__tytul").forEach((el) =>
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: "ease-out" }));
      wpis.classList.remove("wpis--start", "wpis--teksty-ukryte");
      wpis.querySelector(".wpis__ciemne").style.opacity = "";
      obszar.style.minHeight = "";
      uklad.classList.remove("wpis-otwarty");
    };
    if (doHistorii) history.pushState({}, "", indeksBloga);
    document.title = document.body.dataset.tytulBloga;
    if (animacja && !malyRuch.matches && karta && !karta.hidden) {
      wpis.classList.add("wpis--teksty-ukryte");                     // teksty gasną
      const start = prostokat(wpis), cel = prostokat(karta);
      wpis.querySelector(".wpis__biel").animate(
        [{ transform: "translateY(0)" }, { transform: "translateY(100%)" }],
        { duration: 600, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" });
      const a = wpis.animate([px(start), px(cel)], { duration: CZAS, easing: KRZYWA, delay: 200, fill: "forwards" });
      setTimeout(() => { wpis.querySelector(".wpis__ciemne").style.opacity = "1"; }, 200 + CZAS - 300);  // przyciemnienie wraca
      przewinDo(obszar);
      a.onfinish = () => {
        Object.assign(wpis.style, px(cel));
        a.cancel();
        wpis.querySelector(".wpis__biel").getAnimations().forEach((x) => x.cancel());
        koniec();
      };
    } else {
      wpis.querySelector(".wpis__biel").getAnimations().forEach((x) => x.cancel());
      koniec();
    }
  }

  karty.forEach((k) => {
    k.querySelector("a").addEventListener("click", (e) => {
      e.preventDefault();
      otworz(k.dataset.slug, true, true);
    });
  });
  document.querySelectorAll(".wpis__zamknij").forEach((x) => x.addEventListener("click", (e) => {
    e.preventDefault();
    zamknij(true, true);
  }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && otwarty) zamknij(true, true); });

  function zAdresu() {
    const m = location.pathname.match(/\/blog\/([^/]+)\.html$/);
    return m && m[1] !== "index" ? m[1] : null;
  }
  window.addEventListener("popstate", () => {
    const slug = zAdresu();
    if (slug) otworz(slug, true, false); else zamknij(true, false);
  });

  /* ---------- Animacje wejścia tekstów (jak na stronie kancelarii) ---------- */
  const animacje = document.documentElement.classList.contains("anim");
  const ZAKLADKA = 135;
  function odslon(elementy) {
    elementy.forEach((el, i) => {
      el.style.setProperty("--opoznienie", i * ZAKLADKA + "ms");
      el.classList.add("widoczna");
    });
  }
  if (animacje) {
    // nagłówek, tytuł, opis, wyszukiwarka i słowa kluczowe – od razu po wczytaniu
    const gora = [...document.querySelectorAll(".naglowek .linia, .blog-glowa .linia, .blog-boczny .linia")];
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(() => odslon(gora)));
    // kafle i stopka – gdy wjadą na ekran (także po zmianie strony / filtrze)
    let kolejka = [], zaplanowano = false;
    const obs = new IntersectionObserver((wpisy) => {
      wpisy.forEach((w) => { if (w.isIntersecting) { kolejka.push(w.target); obs.unobserve(w.target); } });
      if (!zaplanowano && kolejka.length) {
        zaplanowano = true;
        requestAnimationFrame(() => { odslon(kolejka.map((el, i) => el)); kolejka = []; zaplanowano = false; });
      }
    }, { threshold: 0.1 });
    document.querySelectorAll(".karta, .blog-stopka .linia").forEach((el) => obs.observe(el));
  } else {
    document.querySelectorAll(".linia").forEach((el) => el.classList.add("widoczna"));
  }

  /* start */
  pokazKarty();
  const naStarcie = document.body.dataset.wpis;
  if (naStarcie) {
    const k = karty.find((x) => x.dataset.slug === naStarcie);
    if (k && k.hidden) { strona = Math.floor(karty.indexOf(k) / NA_STRONE) + 1; pokazKarty(); }
    otworz(naStarcie, false, false);
  }

  /* ---------- 4. Rok w stopce ---------- */
  document.querySelectorAll(".rok").forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
