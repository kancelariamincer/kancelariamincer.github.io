/* Przekierowania ze starych adresów strony na Wix, które zawierają polskie znaki
   (nie da się ich bezpiecznie wgrać jako folderów przez przeglądarkę – obsługuje je strona 404). */
(function () {
  var mapa = {
    "/obsługa-przedsiębiorców": "/#specjalizacje",
    "/kopia-obsługa-przedsiębiorców": "/#specjalizacje",
    "/post/zachowek-kiedy-przysługuje-i-jak-skutecznie-go-dochodzić": "/blog/zachowek-kiedy-przysluguje.html",
    "/post/jak-napisać-testament-w-polsce-rodzaje-testamentów-i-ich-znaczenie": "/blog/jak-napisac-testament.html",
    "/post/rozdzielność-majątkowa-możliwości-procedury-i-wymogi-prawne": "/blog/rozdzielnosc-majatkowa.html",
    "/post/zasiedzenie-nieruchomości-czas-koszty-i-praktyczne-przykłady": "/blog/zasiedzenie-nieruchomosci.html",
    "/post/podział-nieruchomości-po-spadku-lub-rozwodzie-jaką-drogę-wybrać-kompleksowy-przewodnik": "/blog/podzial-nieruchomosci-po-spadku-lub-rozwodzie.html",
    "/post/nabycie-spadku-po-zmarłym-członku-rodziny-terminy-procedura-i-skutki-prawne": "/blog/nabycie-spadku.html",
    "/post/testament-w-polskim-prawie-rodzaje-warunki-ważności-i-możliwość-podważenia": "/blog/testament-w-polskim-prawie.html",
    "/post/sprawy-spadkowe-dlaczego-warto-zająć-się-nimi-na-bieżąco": "/blog/sprawy-spadkowe-na-biezaco.html",
    "/blog": "/blog/"
  };
  var sciezka;
  try { sciezka = decodeURIComponent(location.pathname).normalize("NFC").replace(/\/+$/, ""); } catch (e) { return; }
  var cel = mapa[sciezka] || (/^\/post\//.test(sciezka) ? "/blog/" : null);
  if (cel) location.replace(cel);
})();
