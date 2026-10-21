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
  if (!malyRuch && !zmianaJezyka) document.documentElement.classList.add("anim");
})();
