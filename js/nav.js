// Bottom nav interstitial — fires a type:"next" ad on every page switch
(function () {
  var NAV_AD_FALLBACK_MS = 2000;

  document.body.addEventListener("click", function (e) {
    const link = e.target.closest(".bottom-nav a");
    if (!link) return;
    const href = link.getAttribute("href");
    // Skip if already on this page
    if (!href || link.classList.contains("active")) return;
    e.preventDefault();
    e.stopPropagation(); // prevent other body-level click handlers from also firing

    var navigated = false;
    function go() {
      if (navigated) return;
      navigated = true;
      window.location.href = href;
    }

    if (typeof window.adBreak === "function" && window.adReady) {
      var t = setTimeout(go, NAV_AD_FALLBACK_MS);
      window.adBreak({
        type: "next",
        name: "bottom_nav",
        adBreakDone: function () {
          clearTimeout(t);
          go();
        },
      });
    } else {
      go();
    }
  });
})();
