// Bottom nav interstitial — fires a type:"next" ad on every page switch
(function () {
  document.body.addEventListener("click", function (e) {
    const link = e.target.closest(".bottom-nav a");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || link.classList.contains("active")) return;
    e.preventDefault();
    e.stopPropagation();

    var navigated = false;
    function go() {
      if (navigated) return;
      navigated = true;
      window.location.href = href;
    }

    if (typeof window.adBreak === "function" && window.adReady) {
      var fallback = setTimeout(go, 8000);
      window.adBreak({
        type: "browse",
        name: "bottom_nav",
        beforeAd: function () { clearTimeout(fallback); },
        adBreakDone: function () {
          clearTimeout(fallback);
          go();
        },
      });
    } else {
      go();
    }
  });
})();
