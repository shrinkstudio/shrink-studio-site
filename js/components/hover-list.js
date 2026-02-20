(function () {
    function init() {
        gsap.registerPlugin(Flip);
        document.querySelectorAll("[data-hover-list]").forEach(function (component) {
            if (component.hasAttribute("data-hover-init")) return;
            component.setAttribute("data-hover-init", "");
            const items = component.querySelectorAll("[data-hover-item]");
            component.querySelectorAll("[data-hover-background]").forEach((el, i) => i && el.remove());
            const background = component.querySelector("[data-hover-background]");
            const fill = component.querySelector("[data-hover-fill]");
            let hoverBetween = false;
            const tl = gsap.timeline({ paused: true, onReverseComplete: () => hoverBetween = false });
            tl.fromTo(fill, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2 });
            function flipInto(item) {
                const state = Flip.getState(background);
                item.querySelector("[data-hover-visual]")?.prepend(background);
                if (hoverBetween) Flip.from(state, { duration: 0.3, ease: "power1.inOut" });
            }
            items.forEach(function (item) {
                item.addEventListener("mouseenter", function () {
                    flipInto(item);
                    hoverBetween = true;
                });
            });
            component.addEventListener("mouseenter", () => tl.play());
            component.addEventListener("mouseleave", () => tl.reverse());
        });
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
