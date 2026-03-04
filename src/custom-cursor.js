// -----------------------------------------
// CUSTOM CURSOR — Data-attribute driven cursor label
// -----------------------------------------

let mouseMoveHandler = null;
let targetListeners = [];
let xTo = null;
let yTo = null;

export function initCustomCursor(scope) {
  scope = scope || document;

  var cursorItem = scope.querySelector(".cursor");
  if (!cursorItem) return;
  var cursorParagraph = cursorItem.querySelector("p");
  if (!cursorParagraph) return;
  var targets = scope.querySelectorAll("[data-cursor]");
  if (!targets.length) return;

  var xOffset = 6;
  var yOffset = 140;
  var currentTarget = null;
  var lastText = "";

  gsap.set(cursorItem, { position: 'fixed', top: 0, left: 0, xPercent: xOffset, yPercent: yOffset });

  xTo = gsap.quickTo(cursorItem, "x", { ease: "power3" });
  yTo = gsap.quickTo(cursorItem, "y", { ease: "power3" });

  var getCursorEdgeThreshold = function () {
    return cursorItem.offsetWidth + 16;
  };

  mouseMoveHandler = function (e) {
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
  };

  window.addEventListener("mousemove", mouseMoveHandler);

  targets.forEach(function (target) {
    var handler = function () {
      currentTarget = target;
      var newText = target.getAttribute("data-cursor");
      if (newText !== lastText) {
        cursorParagraph.innerHTML = newText;
        lastText = newText;
      }
    };
    target.addEventListener("mouseenter", handler);
    targetListeners.push({ element: target, type: "mouseenter", handler });
  });
}

export function destroyCustomCursor() {
  if (mouseMoveHandler) {
    window.removeEventListener("mousemove", mouseMoveHandler);
    mouseMoveHandler = null;
  }

  targetListeners.forEach(({ element, type, handler }) => {
    element.removeEventListener(type, handler);
  });
  targetListeners = [];

  if (xTo) { gsap.killTweensOf(xTo); xTo = null; }
  if (yTo) { gsap.killTweensOf(yTo); yTo = null; }
}
