// Bottom nav interstitial — fires a type:"next" ad on every page switch
(function () {
  document.body.addEventListener("click", function (e) {
    const link = e.target.closest(".bottom-nav a");
    if (!link) return;
    const href = link.getAttribute("href");
    // Skip if already on this page
    if (!href || link.classList.contains("active")) return;
    e.preventDefault();
    e.stopPropagation(); // prevent other body-level click handlers from also firing

    if (typeof window.adBreak === "function" && window.adReady) {
      window.adBreak({
        type: "next",
        name: "bottom_nav",
        adBreakDone: function () {
          window.location.href = href;
        },
      });
    } else {
      window.location.href = href;
    }
  });
})();
