/*
  chemprocesseng.com site script, loaded by every page:
    <script src="/assets/js/site.js" defer></script>
  Adds the back-to-top button, shown once the reader has scrolled more than a screen.
*/
(function () {
  "use strict";
  if (document.querySelector(".to-top")) return;

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "to-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">' +
    '<path d="M9 15V3.5M3.75 8.25 9 3l5.25 5.25" fill="none" stroke="currentColor" stroke-width="1.75" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(btn);

  var shown = false, ticking = false;
  function update() {
    ticking = false;
    var show = (window.pageYOffset || document.documentElement.scrollTop) > Math.max(600, window.innerHeight);
    if (show !== shown) { shown = show; btn.classList.toggle("is-shown", show); }
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
  update();

  btn.addEventListener("click", function () {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); }
    catch (e) { window.scrollTo(0, 0); }
    var home = document.querySelector(".brand");
    if (home) { try { home.focus({ preventScroll: true }); } catch (e) { home.focus(); } }
  });
})();
