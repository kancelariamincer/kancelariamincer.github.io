/* wersja 45 */
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
        b.setAttribute("aria-label", (document.documentElement.lang === "en" ? "Page " : "Strona ") + i);
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

  /* ---------- Dane kontaktowe przy otwartym wpisie ----------
     Komputer: w prawym dolnym rogu, wyrównane do przycisku ×, widoczne tylko nad białą częścią wpisu
     (tekst jest czarny). Telefon: belka na dole ekranu, stale przy otwartym wpisie. */
  const blogKontakt = document.querySelector(".blog-kontakt");
  const telefon = window.matchMedia("(max-width: 1099px)");
  function aktualizujKontaktBloga() {
    if (!blogKontakt) return;
    let widac = !!otwarty;
    if (widac && !telefon.matches) {
      const w = otwarty.getBoundingClientRect(), k = blogKontakt.getBoundingClientRect();
      const bialeOd = w.top + otwarty.querySelector(".wpis__okladka").offsetHeight;
      widac = k.top > bialeOd && k.bottom < w.bottom - 20;
    }
    blogKontakt.classList.toggle("widoczny", widac);
    zwijanieKontaktu();
  }

  /* Węższy ekran: gdy lewa krawędź danych kontaktowych zbliży się na 50 px do prawej krawędzi
     tekstu wpisu, dane odjeżdżają w prawo (0,5 s, ease-in-out) aż zostanie "tel…" i "e-mail…".
     Jeden egzemplarz tekstu – każda linijka przesuwa się o tyle, ile trzeba; prawa krawędź to maska. */
  let stanZwin = null, zegarMaski = 0;
  function zwijanieKontaktu() {
    if (!blogKontakt) return;
    const linie = [...blogKontakt.querySelectorAll(".blog-kontakt__w")];
    if (!otwarty || telefon.matches) {
      if (stanZwin !== null) { blogKontakt.classList.remove("bk--zwin"); linie.forEach((l) => l.style.removeProperty("--x")); stanZwin = null; }
      return;
    }
    const tresc = otwarty.querySelector(".wpis__tresc");
    const tr = tresc.getBoundingClientRect();
    const kolumna = tr.right - parseFloat(getComputedStyle(tresc).paddingRight);
    const prawa = blogKontakt.getBoundingClientRect().right;
    const pelna = Math.max(...linie.map((l) => l.offsetWidth));
    const zwin = prawa - pelna - kolumna < 50;
    let widoczna = 0;
    linie.forEach((l) => {
      const pref = l.querySelector(".blog-kontakt__pref"), wielo = l.querySelector(".blog-kontakt__wielo");
      if (pref) {
        const w = pref.offsetWidth + wielo.offsetWidth;
        l.style.setProperty("--pref", pref.offsetWidth + "px");
        l.dataset.x = l.offsetWidth - w;
        widoczna = Math.max(widoczna, w);
      } else {
        l.dataset.x = l.offsetWidth + 12;            // godziny wyjeżdżają w całości
      }
    });
    blogKontakt.style.setProperty("--szer", (zwin ? widoczna : pelna) + "px");
    if (zwin === stanZwin) { if (zwin) linie.forEach((l) => l.style.setProperty("--x", l.dataset.x + "px")); return; }
    const pierwszy = stanZwin === null;
    stanZwin = zwin;
    if (pierwszy) blogKontakt.classList.add("bk--bez-animacji");     // małe okno od początku: od razu skrót
    blogKontakt.classList.toggle("bk--zwin", zwin);
    linie.forEach((l) => { if (zwin) l.style.setProperty("--x", l.dataset.x + "px"); else l.style.removeProperty("--x"); });
    if (pierwszy) { void blogKontakt.offsetWidth; requestAnimationFrame(() => blogKontakt.classList.remove("bk--bez-animacji")); return; }
    // maska prawej krawędzi: zakres gradientu 0 → 10 px → 0 w trakcie ruchu
    blogKontakt.classList.remove("bk--maska"); void blogKontakt.offsetWidth; blogKontakt.classList.add("bk--maska");
    clearTimeout(zegarMaski); zegarMaski = setTimeout(() => blogKontakt.classList.remove("bk--maska"), 550);
  }
  // najechanie na zwinięte dane: pełny tekst wychodzi z prawej do lewej (ta sama animacja w drugą stronę)
  function maskaKontaktu() {
    blogKontakt.classList.remove("bk--maska"); void blogKontakt.offsetWidth; blogKontakt.classList.add("bk--maska");
    clearTimeout(zegarMaski); zegarMaski = setTimeout(() => blogKontakt.classList.remove("bk--maska"), 550);
  }
  if (blogKontakt) {
    blogKontakt.addEventListener("pointerenter", () => {
      if (!stanZwin) return;
      const pelna = Math.max(...[...blogKontakt.querySelectorAll(".blog-kontakt__w")].map((l) => l.offsetWidth));
      blogKontakt.dataset.szerZwin = blogKontakt.style.getPropertyValue("--szer");
      blogKontakt.style.setProperty("--szer", pelna + "px");
      blogKontakt.classList.add("bk--hover"); maskaKontaktu();
    });
    blogKontakt.addEventListener("pointerleave", () => {
      if (!blogKontakt.classList.contains("bk--hover")) return;
      blogKontakt.classList.remove("bk--hover");
      if (blogKontakt.dataset.szerZwin) blogKontakt.style.setProperty("--szer", blogKontakt.dataset.szerZwin);
      maskaKontaktu();
    });
  }
  window.addEventListener("scroll", () => requestAnimationFrame(aktualizujKontaktBloga), { passive: true });
  window.addEventListener("resize", aktualizujKontaktBloga);

  // flagi PL / ENG prowadzą do tej samej strony (lista albo ten sam wpis) w drugim języku
  function ustawFlagi(slug) {
    document.querySelectorAll(".blog-jezyki a").forEach((a) => {
      const baza = a.getAttribute("href").replace(/[^/]*$/, "");
      a.setAttribute("href", baza + (slug ? slug + ".html" : ""));
    });
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
  // minHeight 0: bez tego CSS-owe min-height wpisu (1555 px) blokowało animację wysokości –
  // kafel rósł tylko w poziomie, a w pionie od razu "skakał" do 1555 px
  const px = (r) => ({ left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", minHeight: "0px" });

  function linieWpisu(wpis) {
    const tytul = wpis.querySelector(".wpis__tytul");
    const el = [wpis.querySelector(".wpis__data"), wpis.querySelector(".wpis__zamknij")];
    if (!tytul.dataset.lot) el.push(tytul);              // tytuł animowany przelotem – osobno
    el.push(wpis.querySelector(".wpis__lead"));
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

  /* Treść wpisu jest tylko na jego własnej stronie (slug.html) – dzięki temu każdy adres
     ma unikalną treść dla Google. Lista dociąga wpis w tle (już przy najechaniu na kafel). */
  const pobrane = {};
  function pobierzWpis(slug) {
    const jest = document.getElementById("wpis-" + slug);
    if (jest) return Promise.resolve(jest);
    if (!pobrane[slug]) {
      pobrane[slug] = fetch(slug + ".html", { credentials: "same-origin" })
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then((tekst) => {
          const doc = new DOMParser().parseFromString(tekst, "text/html");
          const art = doc.getElementById("wpis-" + slug);
          if (!art) throw new Error("brak wpisu");
          const wpis = document.importNode(art, true);
          wpis.hidden = true;
          const h1 = wpis.querySelector("h1.wpis__tytul");   // na liście tytuł wpisu to h2
          if (h1) { const h2 = document.createElement("h2"); h2.className = h1.className; h2.innerHTML = h1.innerHTML; h1.replaceWith(h2); }
          obszar.appendChild(wpis);
          wpis.querySelector(".wpis__zamknij").addEventListener("click", (e) => { e.preventDefault(); zamknij(true, true); });
          return wpis;
        })
        .catch((e) => { delete pobrane[slug]; throw e; });
    }
    return pobrane[slug];
  }

  function otworz(slug, animacja, doHistorii) {
    const jest = document.getElementById("wpis-" + slug);
    if (!jest) {
      pobierzWpis(slug).then(() => otworz(slug, animacja, doHistorii))
        .catch(() => { location.href = slug + ".html"; });   // awaryjnie zwykłe przejście na stronę wpisu
      return;
    }
    const wpis = jest;
    if (otwarty === wpis) return;
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
    setTimeout(aktualizujKontaktBloga, CZAS + 50);
    if (doHistorii) history.pushState({ wpis: slug }, "", slug + ".html");
    document.title = wpis.dataset.tytul + (document.body.dataset.sufiks || "");
    ustawFlagi(slug);

    if (ruch && karta && !karta.hidden) {
      const lot = telefon.matches ? null : przygotujLot(karta, wpis);   // tytuł "przelatuje" z kafla
      const start = prostokat(karta);
      wpis.classList.add("wpis--start");                 // przyciemnienie 100%, biel schowana pod kaflem
      Object.assign(wpis.style, px(start));
      przewinDo(obszar);
      void wpis.offsetWidth;
      wpis.querySelector(".wpis__ciemne").style.opacity = "0";   // 1) przyciemnienie gaśnie
      trwa = setTimeout(() => {
        // 2) kafel rośnie, biel wyjeżdża spod spodu, teksty wchodzą
        const a = wpis.animate([px(start), px(cel)], { duration: CZAS, easing: KRZYWA, fill: "forwards" });
        // styl startowy zostaje do końca animacji – inaczej przez klatkę wpis miga w pełnym rozmiarze
        a.onfinish = () => { wpis.style.cssText = ""; a.cancel(); };
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
        if (lot) lot.start();
      }, WYGASZENIE);
    } else {
      pokazTeksty(wpis, 300);           // np. wejście prosto na adres wpisu – teksty wchodzą kolejno
    }
  }

  /* tekst kafla jako pojedyncze litery (słowa się nie rozdzielają) */
  function litery(karta) {
    if (!karta.dataset.litery) {
      karta.querySelectorAll(".karta__data, .karta__tytul").forEach((el) => {
        const tekst = el.textContent;
        el.textContent = "";
        tekst.split(/(\s+)/).forEach((kawalek) => {
          if (/^\s+$/.test(kawalek)) { el.appendChild(document.createTextNode(kawalek)); return; }
          const slowo = document.createElement("span");
          slowo.className = "karta__slowo";
          [...kawalek].forEach((z) => {
            const l = document.createElement("span");
            l.className = "karta__litera";
            l.textContent = z;
            slowo.appendChild(l);
          });
          el.appendChild(slowo);
        });
      });
      karta.dataset.litery = "1";
    }
    return [...karta.querySelectorAll(".karta__litera")];
  }
  function ukryjTekstKarty(karta) { litery(karta).forEach((l) => { l.style.opacity = "0"; }); }
  function napiszTekstKarty(karta) {
    const l = litery(karta), krok = Math.min(18, 700 / l.length);
    l.forEach((x, i) => {
      x.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: i * krok, easing: "ease-out", fill: "forwards" })
        .onfinish = () => { x.style.opacity = ""; };
    });
  }

  /* Przelot tytułu: pierwsza linijka tytułu z kafla leci na miejsce pierwszej linijki tytułu we wpisie,
     dalsze linijki kafla gasną, a reszta tytułu wpisu (z łamaniem jak we wpisie) pisze się w trakcie otwierania. */
  function slowaTytulu(el) {
    if (!el.dataset.slowa) {
      const tekst = el.textContent.trim();
      el.textContent = "";
      tekst.split(/\s+/).forEach((slowo, i) => {
        if (i) el.appendChild(document.createTextNode(" "));
        const sp = document.createElement("span");
        sp.className = "karta__slowo";
        [...slowo].forEach((z) => { const l = document.createElement("span"); l.className = "karta__litera"; l.textContent = z; sp.appendChild(l); });
        el.appendChild(sp);
      });
      el.dataset.slowa = "1";
    }
    return [...el.querySelectorAll(".karta__slowo")];
  }
  function przygotujLot(karta, wpis) {
    const tk = karta.querySelector(".karta__tytul"), tw = wpis.querySelector(".wpis__tytul");
    litery(karta);
    const sk = [...tk.querySelectorAll(".karta__slowo")];
    const sw = slowaTytulu(tw);
    if (!sk.length || sk.length !== sw.length) return null;
    const gora = sk[0].getBoundingClientRect().top;
    const n = sk.filter((x) => Math.abs(x.getBoundingClientRect().top - gora) < 4).length;
    // pozycje (względem obszaru kafli): tytuł na kaflu teraz, tytuł we wpisie po rozwinięciu (wpis ma już docelowy układ)
    const o = obszar.getBoundingClientRect(), rk = tk.getBoundingClientRect(), rw = tw.getBoundingClientRect();
    const klon = tk.cloneNode(true);
    klon.classList.add("tytul-lot");
    Object.assign(klon.style, { left: rk.left - o.left + "px", top: rk.top - o.top + "px", width: rk.width + "px" });
    const dx = rw.left - rk.left, dy = rw.top - rk.top;
    tw.dataset.lot = "1";
    sw.forEach((x, i) => { x.style.opacity = "0"; });
    return {
      start() {
        obszar.appendChild(klon);
        const ks = [...klon.querySelectorAll(".karta__slowo")];
        ks.slice(n).forEach((x) => x.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" }));   // szybko gasną
        klon.animate([{ transform: "translate(0, 0)" }, { transform: `translate(${dx}px, ${dy}px)` }],
          { duration: CZAS, easing: KRZYWA, fill: "forwards" });
        // reszta tytułu wpisu pisze się litera po literze w trakcie otwierania
        const reszta = sw.slice(n);
        reszta.forEach((x) => { x.style.opacity = ""; x.querySelectorAll(".karta__litera").forEach((l) => { l.style.opacity = "0"; }); });
        const l = reszta.flatMap((x) => [...x.querySelectorAll(".karta__litera")]);
        // reszta tytułu buduje się wolniej, dopiero gdy dolne linijki z kafla zgasną (bez nakładania tekstów)
        const krok = l.length ? 1100 / l.length : 0;
        l.forEach((x, i) => x.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, delay: 260 + i * krok, fill: "forwards" })
          .onfinish = () => { x.style.opacity = ""; });
        setTimeout(() => {
          sw.slice(0, n).forEach((x) => { x.style.opacity = ""; });
          klon.remove();
        }, CZAS + 30);
        setTimeout(() => { delete tw.dataset.lot; }, 260 + 1100 + 500);
      },
    };
  }

  function zamknij(animacja, doHistorii) {
    const wpis = otwarty;
    if (!wpis) return;
    otwarty = null;
    clearTimeout(trwa);
    aktualizujKontaktBloga();
    const karta = karty.find((k) => k.dataset.slug === wpis.dataset.slug);
    const koniec = () => {
      if (document.activeElement && wpis.contains(document.activeElement) || document.activeElement && document.activeElement.closest && document.activeElement.closest(".karta")) document.activeElement.blur();
      wpis.hidden = true;
      wpis.style.cssText = "";
      wpis.classList.remove("wpis--start", "wpis--teksty-ukryte");
      wpis.querySelector(".wpis__ciemne").style.opacity = "";
      obszar.style.minHeight = "";
      uklad.classList.remove("wpis-otwarty");
    };
    if (doHistorii) history.pushState({}, "", indeksBloga);
    document.title = document.body.dataset.tytulBloga;
    ustawFlagi(null);
    if (animacja && !malyRuch.matches && karta && !karta.hidden) {
      wpis.classList.add("wpis--teksty-ukryte");                     // teksty gasną, gradient zostaje
      // start = tylko widoczna część wpisu (od góry wpisu do dolnej krawędzi ekranu) –
      // dzięki temu wszystkie krawędzie dochodzą do kafla w tym samym czasie, proporcjonalnie
      const r = wpis.getBoundingClientRect();
      const start = prostokat(wpis), cel = prostokat(karta);
      start.height = Math.max(cel.height, Math.min(r.height, window.innerHeight - r.top));
      Object.assign(wpis.style, px(start));
      const a = wpis.animate([px(start), px(cel)], { duration: CZAS, easing: KRZYWA, delay: 200, fill: "forwards" });
      // na samym końcu wpis łagodnie przechodzi w kafel pod spodem
      wpis.animate([{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: CZAS, delay: 200, fill: "forwards" });
      setTimeout(() => { wpis.querySelector(".wpis__ciemne").style.opacity = "1"; }, 200 + CZAS - 300);
      // tekst na kaflu "pisze się" litera po literze – start 0,5 s przed uformowaniem kafla
      ukryjTekstKarty(karta);
      setTimeout(() => napiszTekstKarty(karta), 200 + CZAS - 500);
      przewinDo(obszar);
      a.onfinish = () => {
        Object.assign(wpis.style, px(cel));
        wpis.getAnimations().forEach((x) => x.cancel());
        koniec();
      };
    } else {
      wpis.querySelector(".wpis__biel").getAnimations().forEach((x) => x.cancel());
      koniec();
    }
  }

  karty.forEach((k) => {
    const wstepnie = () => { pobierzWpis(k.dataset.slug).catch(() => {}); };
    k.addEventListener("pointerenter", wstepnie, { once: true });
    k.addEventListener("touchstart", wstepnie, { once: true, passive: true });
    k.addEventListener("focusin", wstepnie, { once: true });
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
