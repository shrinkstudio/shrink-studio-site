document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-project-list]").forEach(function (list) {
    if (list.hasAttribute("data-project-init")) return;
    list.setAttribute("data-project-init", "");

    var items = list.querySelectorAll("[data-project-item]");
    var lastIndex = 0;
    var tls = [];

    // Set initial state — all media hidden below their container
    gsap.set(list.querySelectorAll("[data-project-media]"), { y: "100%" });

    items.forEach(function (item, index) {
      var medias = item.querySelectorAll("[data-project-media]");

      // Create a timeline for each row's media reveal
      var tl = gsap.timeline({ paused: index !== 0 });
      tl.to(medias, {
        y: "0%",
        stagger: { each: 0.04, from: "random" },
        duration: 0.4,
        ease: "power4.out",
      });

      tls.push(tl);

      // First item starts expanded
      if (index === 0) {
        gsap.set(item, { flex: "1 1 122px" });
      }

      item.addEventListener("mouseenter", function () {
        // Reverse previous row's media (3x speed)
        tls[lastIndex].timeScale(3).reverse();
        lastIndex = index;

        // Play new row's media (normal speed)
        tls[index].timeScale(1).play();

        // Collapse all rows
        gsap.to(items, {
          flex: "1 1 45px",
          duration: 0.2,
          ease: "power2.inOut",
        });

        // Expand hovered row
        gsap.to(item, {
          flex: "1 1 122px",
          duration: 0.2,
          ease: "power2.inOut",
        });
      });
    });
  });
});
