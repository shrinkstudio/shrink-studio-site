(function () {
  function init() {
    document.querySelectorAll("[data-project-list]").forEach(function (list) {
      if (list.hasAttribute("data-project-init")) return;
      list.setAttribute("data-project-init", "");

      var items = list.querySelectorAll("[data-project-item]");
      var lastIndex = 0;
      var tls = [];

      var paddingCollapsed = "0.5rem";
      var paddingExpanded = "2rem";

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

        if (index !== 0) {
          gsap.set(item, { paddingTop: paddingCollapsed, paddingBottom: paddingCollapsed });
        }

        item.addEventListener("mouseenter", function () {
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
        });
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
