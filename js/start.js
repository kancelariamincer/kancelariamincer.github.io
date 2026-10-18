/* Włącza animacje wejścia (jeśli użytkownik nie wyłączył animacji w systemie).
   Bez animacji, gdy ktoś przechodzi między stronami tej witryny – np. przełącznikiem PL / ENG –
   żeby strona nie "budowała się" od nowa. Bez JavaScriptu cała treść jest od razu widoczna. */
(function () {
  var malyRuch = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var zTejStrony = false;
  try {
    var r = document.referrer ? new URL(document.referrer) : null;
    zTejStrony = !!r && r.origin === location.origin && r.pathname !== location.pathname;
  } catch (e) {}
  if (!malyRuch && !zTejStrony) document.documentElement.classList.add("anim");
})();
