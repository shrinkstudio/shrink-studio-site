(function () {
  function init() {
    var magnets = document.querySelectorAll("[data-magnetic-strength]");
    if (window.innerWidth <= 991) return;

    var resetEl = function (el, immediate) {
      if (!el) return;
      gsap.killTweensOf(el);
      var props = { x: "0em", y: "0em", rotate: "0deg", clearProps: "all" };
      if (immediate) {
        gsap.set(el, props);
      } else {
        props.ease = "elastic.out(1, 0.3)";
        props.duration = 1.6;
        gsap.to(el, props);
      }
    };

    var resetOnEnter = function (e) {
      var m = e.currentTarget;
      resetEl(m, true);
      resetEl(m.querySelector("[data-magnetic-inner-target]"), true);
    };

    var moveMagnet = function (e) {
      var m = e.currentTarget;
      var b = m.getBoundingClientRect();
      var strength = parseFloat(m.getAttribute("data-magnetic-strength")) || 25;
      var inner = m.querySelector("[data-magnetic-inner-target]");
      var innerStrength = parseFloat(m.getAttribute("data-magnetic-strength-inner")) || strength;
      var offsetX = ((e.clientX - b.left) / m.offsetWidth - 0.5) * (strength / 16);
      var offsetY = ((e.clientY - b.top) / m.offsetHeight - 0.5) * (strength / 16);

      gsap.to(m, { x: offsetX + "em", y: offsetY + "em", rotate: "0.001deg", ease: "power4.out", duration: 1.6 });

      if (inner) {
        var innerOffsetX = ((e.clientX - b.left) / m.offsetWidth - 0.5) * (innerStrength / 16);
        var innerOffsetY = ((e.clientY - b.top) / m.offsetHeight - 0.5) * (innerStrength / 16);
        gsap.to(inner, { x: innerOffsetX + "em", y: innerOffsetY + "em", rotate: "0.001deg", ease: "power4.out", duration: 2 });
      }
    };

    var resetMagnet = function (e) {
      var m = e.currentTarget;
      var inner = m.querySelector("[data-magnetic-inner-target]");
      gsap.to(m, { x: "0em", y: "0em", ease: "elastic.out(1, 0.3)", duration: 1.6, clearProps: "all" });
      if (inner) {
        gsap.to(inner, { x: "0em", y: "0em", ease: "elastic.out(1, 0.3)", duration: 2, clearProps: "all" });
      }
    };

    magnets.forEach(function (m) {
      m.addEventListener("mouseenter", resetOnEnter);
      m.addEventListener("mousemove", moveMagnet);
      m.addEventListener("mouseleave", resetMagnet);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
