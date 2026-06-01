// -----------------------------------------
// PROJECTS LISTING — Touch fallback for hover effect
// (Desktop hover is pure CSS in the Webflow embed. On touch devices
//  we add .is-active to each card as it scrolls into view so the same
//  styles fire without needing :hover.)
// -----------------------------------------

let mm = null;

export function initProjectsListing(scope) {
  scope = scope || document;
  const items = Array.from(scope.querySelectorAll(".projects-listing__item"));
  if (!items.length) return;
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  mm = gsap.matchMedia();
  mm.add("(hover: none), (pointer: coarse)", function () {
    const triggers = items.map(function (item) {
      return ScrollTrigger.create({
        trigger: item,
        start: "top 65%",
        end: "bottom 35%",
        onEnter: function () { item.classList.add("is-active"); },
        onLeave: function () { item.classList.remove("is-active"); },
        onEnterBack: function () { item.classList.add("is-active"); },
        onLeaveBack: function () { item.classList.remove("is-active"); },
      });
    });
    return function cleanup() {
      triggers.forEach(function (t) { try { t.kill(); } catch (_) {} });
      items.forEach(function (item) { item.classList.remove("is-active"); });
    };
  });
}

export function destroyProjectsListing() {
  if (mm) {
    try { mm.revert(); } catch (_) {}
    mm = null;
  }
}
