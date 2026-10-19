/* wersja 19 */
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

  /* ---------- 3. Rozwijanie kafla we wpis ---------- */
  const CZAS = 700;
  const KRZYWA = "cubic-bezier(0.2, 0.7, 0.1, 1)";
  const indeksBloga = document.body.dataset.indeks || "./";
  let otwarty = null;

  function prostokat(el) {
    const a = obszar.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { left: r.left - a.left, top: r.top - a.top, width: r.width, height: r.height };
  }
  const px = (r) => ({ left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });

  function otworz(slug, animacja, doHistorii) {
    const wpis = document.getElementById("wpis-" + slug);
    if (!wpis || otwarty === wpis) return;
    zamknij(false);
    const karta = karty.find((k) => k.dataset.slug === slug);
    wpis.hidden = false;
    wpis.classList.add("wpis--animacja");
    const cel = { left: 0, top: 0, width: wpis.offsetWidth, height: wpis.offsetHeight };
    obszar.style.minHeight = cel.height + "px";
    uklad.classList.add("wpis-otwarty");
    otwarty = wpis;
    if (doHistorii) history.pushState({ wpis: slug }, "", slug + ".html");
    document.title = wpis.dataset.tytul + " – Blog kancelarii";

    const zKarty = animacja && !malyRuch.matches && karta && !karta.hidden;
    if (zKarty) {
      const start = prostokat(karta);
      przewinDo(obszar);
      const a = wpis.animate([px(start), px(cel)], { duration: CZAS, easing: KRZYWA });
      a.onfinish = () => wpis.classList.remove("wpis--animacja");
    } else {
      wpis.classList.remove("wpis--animacja");
    }
    wpis.querySelector(".wpis__zamknij").focus({ preventScroll: true });
  }

  function zamknij(animacja, doHistorii) {
    const wpis = otwarty;
    if (!wpis) return;
    otwarty = null;
    const karta = karty.find((k) => k.dataset.slug === wpis.dataset.slug);
    const koniec = () => {
      wpis.hidden = true;
      wpis.classList.remove("wpis--animacja");
      obszar.style.minHeight = "";
      uklad.classList.remove("wpis-otwarty");
      if (karta) karta.querySelector("a").focus({ preventScroll: true });
    };
    if (doHistorii) history.pushState({}, "", indeksBloga);
    document.title = document.body.dataset.tytulBloga;
    if (animacja && !malyRuch.matches && karta && !karta.hidden) {
      wpis.classList.add("wpis--animacja");          // treść gaśnie
      const start = prostokat(wpis);
      uklad.classList.remove("wpis-otwarty");        // kafle wracają
      const cel = prostokat(karta);
      const a = wpis.animate([px(start), px(cel)], { duration: CZAS, easing: KRZYWA, delay: 150, fill: "forwards" });
      przewinDo(obszar);
      a.onfinish = () => { a.cancel(); koniec(); };
    } else {
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
