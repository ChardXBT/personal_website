(function () {
  var root = document.documentElement;
  var timer = 0;

  function restoreProgressiveContent() {
    var regions = document.querySelectorAll("#project-panel, #static-site");
    var interactive = document.querySelectorAll(
      "[data-project], #static-site a, #static-site button"
    );
    var detail = document.querySelector("#project-detail");

    Array.prototype.forEach.call(regions, function (region) {
      region.inert = false;
      region.removeAttribute("inert");
      region.removeAttribute("aria-hidden");
    });
    Array.prototype.forEach.call(interactive, function (element) {
      element.removeAttribute("tabindex");
      element.removeAttribute("aria-disabled");
      if (element.hasAttribute("data-project")) {
        element.setAttribute("aria-expanded", "false");
      }
    });
    if (detail) {
      detail.classList.remove("is-visible");
      detail.hidden = true;
    }
  }

  function restoreFallback() {
    if (root.classList.contains("intro-ready")) return;
    var stage = document.querySelector("#intro-stage");
    root.classList.remove(
      "has-js",
      "intro-locked",
      "canvas-mode",
      "canvas-settling",
      "canvas-ready",
      "detail-locked",
      "skip-settling"
    );
    if (stage) {
      stage.classList.remove("canvas-ready", "is-resolving-list", "is-settling-heading", "is-settling-list");
      stage.dataset.scene = "build";
      stage.dataset.projectPhase = "list";
    }
    root.classList.add("no-js");
    restoreProgressiveContent();
  }

  function onScriptLoadError(event) {
    var target = event.target;
    if (!target || target.tagName !== "SCRIPT" || target.type !== "module") return;
    restoreFallback();
  }

  function armFallback() {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(function () {
      timer = 0;
      restoreFallback();
    }, 3000);
  }

  root.classList.remove("no-js");
  root.classList.add("has-js", "intro-locked");
  window.addEventListener("error", onScriptLoadError, true);
  armFallback();
  window.__portfolioIntroFallback = {
    arm: armFallback,
    cancel: function () {
      window.removeEventListener("error", onScriptLoadError, true);
      if (!timer) return;
      window.clearTimeout(timer);
      timer = 0;
    }
  };
})();
