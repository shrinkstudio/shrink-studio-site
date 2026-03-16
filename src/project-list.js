// -----------------------------------------
// PROJECT LIST — Staggered media reveal on hover
// -----------------------------------------

const DESKTOP_MQ = window.matchMedia("(min-width: 992px)");

let storedTimelines = [];
let listeners = [];
let initializedLists = [];

export function initProjectList(scope) {
  if (!DESKTOP_MQ.matches) return;

  scope = scope || document;

  scope.querySelectorAll("[data-project-list]").forEach(function (list) {
    if (list.hasAttribute("data-project-init")) return;
    list.setAttribute("data-project-init", "");
    initializedLists.push(list);

    var items = list.querySelectorAll("[data-project-item]");
    var lastIndex = 0;
    var tls = [];

    var paddingCollapsed = "2rem";
    var paddingExpanded = "4rem";

    gsap.set(list, { opacity: 0 });
    gsap.set(list.querySelectorAll("[data-project-media]"), { y: "100%" });

    items.forEach(function (item, index) {
      var medias = item.querySelectorAll("[data-project-media]");

      var tl = gsap.timeline({ paused: index !== 0 });
      tl.to(medias, {
        y: "0%",
        stagger: { each: 0.04, from: "random" },
        duration: 0.4,
        ease: "power4.out",
      });

      tls.push(tl);
      storedTimelines.push(tl);

      if (index === 0) {
        gsap.set(item, { paddingTop: paddingExpanded, paddingBottom: paddingExpanded });
      }

      var handler = function () {
        tls[lastIndex].timeScale(3).reverse();
        lastIndex = index;
        tls[index].timeScale(1).play();

        gsap.to(items, {
          paddingTop: paddingCollapsed,
          paddingBottom: paddingCollapsed,
          duration: 0.2,
          ease: "power2.inOut",
        });

        gsap.to(item, {
          paddingTop: paddingExpanded,
          paddingBottom: paddingExpanded,
          duration: 0.2,
          ease: "power2.inOut",
        });

        gsap.to(items, {
          opacity: 0.5,
          duration: 0.2,
          ease: "power2.inOut",
        });

        gsap.to(item, {
          opacity: 1,
          duration: 0.2,
          ease: "power2.inOut",
        });
      };
      item.addEventListener("mouseenter", handler);
      listeners.push({ element: item, type: "mouseenter", handler });
    });

    gsap.set(list, { opacity: 1 });

    var leaveHandler = function () {
      tls[lastIndex].timeScale(3).reverse();

      gsap.to(items, {
        paddingTop: paddingCollapsed,
        paddingBottom: paddingCollapsed,
        opacity: 1,
        duration: 0.2,
        ease: "power2.inOut",
      });
    };
    list.addEventListener("mouseleave", leaveHandler);
    listeners.push({ element: list, type: "mouseleave", handler: leaveHandler });
  });
}

export function destroyProjectList() {
  storedTimelines.forEach(tl => { try { tl.kill(); } catch (_) {} });
  storedTimelines = [];

  listeners.forEach(({ element, type, handler }) => {
    element.removeEventListener(type, handler);
  });
  listeners = [];

  initializedLists.forEach(el => {
    el.removeAttribute("data-project-init");
  });
  initializedLists = [];
}
