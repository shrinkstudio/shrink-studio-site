(function () {
  function init() {
    var cursorItem = document.querySelector(".cursor");
    if (!cursorItem) return;
    var cursorParagraph = cursorItem.querySelector("p");
    if (!cursorParagraph) return;
    var targets = document.querySelectorAll("[data-cursor]");
    if (!targets.length) return;

    var xOffset = 6;
    var yOffset = 140;
    var currentTarget = null;
    var lastText = "";

    gsap.set(cursorItem, { xPercent: xOffset, yPercent: yOffset });

    var xTo = gsap.quickTo(cursorItem, "x", { ease: "power3" });
    var yTo = gsap.quickTo(cursorItem, "y", { ease: "power3" });

    var getCursorEdgeThreshold = function () {
      return cursorItem.offsetWidth + 16;
    };

    window.addEventListener("mousemove", function (e) {
      var windowWidth = window.innerWidth;
      var windowHeight = window.innerHeight;
      var scrollY = window.scrollY;
      var cursorX = e.clientX;
      var cursorY = e.clientY + scrollY;

      var xPercent = xOffset;
      var yPercent = yOffset;

      var cursorEdgeThreshold = getCursorEdgeThreshold();
      if (cursorX > windowWidth - cursorEdgeThreshold) {
        xPercent = -100;
      }

      if (cursorY > scrollY + windowHeight * 0.9) {
        yPercent = -120;
      }

      if (currentTarget) {
        var newText = currentTarget.getAttribute("data-cursor");
        if (newText !== lastText) {
          cursorParagraph.innerHTML = newText;
          lastText = newText;
        }
      }

      gsap.to(cursorItem, {
        xPercent: xPercent,
        yPercent: yPercent,
        duration: 0.9,
        ease: "power3"
      });
      xTo(cursorX);
      yTo(cursorY - scrollY);
    });

    targets.forEach(function (target) {
      target.addEventListener("mouseenter", function () {
        currentTarget = target;
        var newText = target.getAttribute("data-cursor");
        if (newText !== lastText) {
          cursorParagraph.innerHTML = newText;
          lastText = newText;
        }
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
