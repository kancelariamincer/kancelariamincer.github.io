/* wersja 39 */
/* =========================================================
   Pliki cookies i analityka (Google Analytics 4)
   - Analityka ładuje się WYŁĄCZNIE po zgodzie użytkownika
     (do tego czasu na urządzeniu nie zapisuje się nic poza samym wyborem).
   - "Odrzucam" jest tak samo łatwe jak "Akceptuję".
   - Zgodę można zmienić w każdej chwili przyciskiem "Ustawienia cookies" w stopce.
   ========================================================= */
(function () {
  "use strict";

  // >>> Identyfikator Google Analytics 4 (np. "G-AB12CD34EF"). Pusty = analityka wyłączona.
  const ID_ANALITYKI = "";
  const KLUCZ = "kancelaria-zgody";
  const WERSJA = 1;                    // zmiana zakresu zgód → podnieść, baner pokaże się ponownie
  const WAZNOSC_DNI = 365;             // po roku pytamy ponownie

  const baner = document.getElementById("zgody");
  if (!baner) return;
  const poleAnalityka = baner.querySelector("#zgoda-analityka");
  const ustawienia = baner.querySelector(".zgody__ustawienia");
  const przyciskUstaw = baner.querySelector(".zgody__ustaw");
  const przyciskZapisz = baner.querySelector(".zgody__zapisz");

  function odczytaj() {
    try {
      const z = JSON.parse(localStorage.getItem(KLUCZ) || "null");
      if (!z || z.wersja !== WERSJA) return null;
      if (Date.now() - z.czas > WAZNOSC_DNI * 864e5) return null;
      return z;
    } catch (e) { return null; }
  }
  function zapisz(analityka) {
    const z = { wersja: WERSJA, czas: Date.now(), analityka: !!analityka };
    try { localStorage.setItem(KLUCZ, JSON.stringify(z)); } catch (e) {}
    zastosuj(z);
    schowaj();
  }

  /* --- Google Analytics: ładowanie po zgodzie, sprzątanie po jej cofnięciu --- */
  let zaladowano = false;
  function wlaczAnalityke() {
    if (!ID_ANALITYKI || zaladowano) return;
    zaladowano = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied"
    });
    window.gtag("js", new Date());
    window.gtag("config", ID_ANALITYKI, { allow_google_signals: false, allow_ad_personalization_signals: false });
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ID_ANALITYKI);
    document.head.appendChild(s);
  }
  function wylaczAnalityke() {
    if (window.gtag) window.gtag("consent", "update", { analytics_storage: "denied" });
    // usunięcie ciasteczek GA (_ga, _ga_XXXX) z bieżącej domeny i domeny nadrzędnej
    const host = location.hostname, domeny = ["", host, "." + host, "." + host.split(".").slice(-2).join(".")];
    document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter((n) => /^_ga/.test(n)).forEach((n) => {
      domeny.forEach((d) => {
        document.cookie = n + "=; Max-Age=0; path=/" + (d ? "; domain=" + d : "");
      });
    });
  }
  function zastosuj(z) {
    if (z && z.analityka) wlaczAnalityke();
    else { const bylo = zaladowano; wylaczAnalityke(); if (bylo) location.reload(); }
  }

  /* --- baner --- */
  function pokaz(zUstawieniami) {
    const z = odczytaj();
    poleAnalityka.checked = !!(z && z.analityka);
    ustawienia.hidden = !zUstawieniami;
    przyciskZapisz.hidden = !zUstawieniami;
    przyciskUstaw.hidden = !!zUstawieniami;
    baner.hidden = false;
    requestAnimationFrame(() => baner.classList.add("zgody--widoczne"));
  }
  function schowaj() {
    baner.classList.remove("zgody--widoczne");
    setTimeout(() => { baner.hidden = true; }, 450);
  }

  baner.querySelector(".zgody__akceptuj").addEventListener("click", () => zapisz(true));
  baner.querySelector(".zgody__odrzuc").addEventListener("click", () => zapisz(false));
  przyciskZapisz.addEventListener("click", () => zapisz(poleAnalityka.checked));
  przyciskUstaw.addEventListener("click", () => {
    ustawienia.hidden = false; przyciskZapisz.hidden = false; przyciskUstaw.hidden = true;
    poleAnalityka.focus();
  });
  // "Ustawienia cookies" w stopce (delegacja – przyciski są podmieniane przy zmianie języka)
  document.addEventListener("click", (e) => {
    if (e.target.closest(".zgody-otworz")) { e.preventDefault(); pokaz(true); }
  });

  const zapisane = odczytaj();
  if (zapisane) zastosuj(zapisane);
  else setTimeout(() => pokaz(false), 1200);   // po animacji wejścia strony
})();
