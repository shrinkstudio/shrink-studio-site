(function () {
  function init() {
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll("[data-footer-parallax]").forEach(function (el) {
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "clamp(top bottom)",
          end: "clamp(top top)",
          scrub: true
        }
      });

      var inner = el.querySelector("[data-footer-parallax-inner]");
      var dark = el.querySelector("[data-footer-parallax-dark]");

      if (inner) {
        tl.from(inner, {
          yPercent: -25,
          ease: "linear"
        });
      }

      if (dark) {
        tl.from(dark, {
          opacity: 0.5,
          ease: "linear"
        }, "<");
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
