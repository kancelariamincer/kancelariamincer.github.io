/* Włącza animacje wejścia (jeśli użytkownik nie wyłączył animacji w systemie).
   Bez animacji tylko wtedy, gdy ktoś przechodzi na drugą wersję językową tej samej strony
   (zapasowa ścieżka przełącznika PL / ENG). Bez JavaScriptu cała treść jest od razu widoczna. */
(function () {
  var malyRuch = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var zmianaJezyka = false;
  try {
    var r = document.referrer ? new URL(document.referrer) : null;
    var bezJezyka = function (p) { return p.replace(/^\/en\//, "/").replace(/index\.html$/, ""); };
    zmianaJezyka = !!r && r.origin === location.origin && r.pathname !== location.pathname &&
      bezJezyka(r.pathname) === bezJezyka(location.pathname);
  } catch (e) {}
  // przejście z bloga na stronę kancelarii: strona wjeżdża z prawej gotowa (bez animacji wejścia)
  var zBloga = false;
  try { var rr = document.referrer ? new URL(document.referrer) : null;
        zBloga = !!rr && rr.origin === location.origin && /\/blog\//.test(rr.pathname) && !/\/blog\//.test(location.pathname); } catch (e) {}
  // każda strona (kancelaria, blog) animuje wejście tylko przy pierwszym wczytaniu w danej sesji
  var klucz = "widziano:" + location.pathname.replace(/[^/]*\.html$/, "").replace(/^\/en\//, "/");
  var widziana = false;
  try { widziana = sessionStorage.getItem(klucz) === "1"; sessionStorage.setItem(klucz, "1"); } catch (e) {}
  if (!malyRuch && !zmianaJezyka && !zBloga && !widziana) document.documentElement.classList.add("anim");
  // telefon: po przejściu z bloga animujemy przyciski menu
  if (zBloga && !malyRuch && window.matchMedia("(max-width: 1099px)").matches) document.documentElement.classList.add("anim-menu");

  // przejścia między stronami (View Transitions): tylko blog → kancelaria = przesunięcie w lewo
  window.addEventListener("pagereveal", function (e) {
    if (!e.viewTransition) return;
    var od = "";
    try { od = navigation.activation && navigation.activation.from ? new URL(navigation.activation.from.url).pathname : ""; } catch (x) {}
    if (/\/blog\//.test(od) && !/\/blog\//.test(location.pathname)) e.viewTransition.types.add("z-bloga");
    else e.viewTransition.skipTransition();
  });
})();
