// -----------------------------------------
// HIGHLIGHT TEXT — Scroll-driven character reveal
// Based on Osmo highlight text effect
// -----------------------------------------
// Attributes:
//   [data-highlight-text]              — target heading/text element
//   [data-highlight-scroll-start]      — optional ScrollTrigger start (default: "top 90%")
//   [data-highlight-scroll-end]        — optional ScrollTrigger end (default: "center 40%")
//   [data-highlight-fade]              — optional base opacity (default: 0.2)
//   [data-highlight-stagger]           — optional stagger value (default: 0.1)

let splits = [];

function initWordScatter(scope) {
  scope = scope || document;
  var targets = scope.querySelectorAll('[data-highlight-text]');
  if (!targets.length) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || typeof SplitText === 'undefined') return;

  targets.forEach(function (heading) {
    var scrollStart = heading.getAttribute('data-highlight-scroll-start') || 'top 90%';
    var scrollEnd = heading.getAttribute('data-highlight-scroll-end') || 'center 40%';
    var fadedValue = parseFloat(heading.getAttribute('data-highlight-fade')) || 0.2;
    var staggerValue = parseFloat(heading.getAttribute('data-highlight-stagger')) || 0.1;

    var split = new SplitText(heading, {
      type: 'words, chars',
      autoSplit: true,
      onSplit: function (self) {
        var ctx = gsap.context(function () {
          gsap.timeline({
            scrollTrigger: {
              scrub: true,
              trigger: heading,
              start: scrollStart,
              end: scrollEnd,
            },
          }).from(self.chars, {
            autoAlpha: fadedValue,
            stagger: staggerValue,
            ease: 'linear',
          });
        });
        return ctx;
      },
    });

    splits.push(split);
  });
}

function destroyWordScatter() {
  splits.forEach(function (split) {
    if (split && split.revert) split.revert();
  });
  splits = [];
}

export { initWordScatter, destroyWordScatter };
