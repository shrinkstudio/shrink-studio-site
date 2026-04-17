// -----------------------------------------
// SPLIT TEXT — Scroll-triggered masked text reveal
// Lines, words, or chars with SplitText + ScrollTrigger
// -----------------------------------------
// Attributes:
//   [data-split="heading"]            — target element
//   [data-split-reveal="lines"]       — split type: "lines" | "words" | "chars" (default: "lines")
//   [data-split-start="top 80%"]      — optional ScrollTrigger start
//   [data-split-stagger]              — optional stagger override (seconds)
//   [data-split-duration]             — optional duration override (seconds)
//
// CSS (add to Webflow custom code):
//   [data-split="heading"] { visibility: hidden; }
//   .wf-design-mode [data-split="heading"],
//   .w-editor [data-split="heading"] { visibility: visible !important; }

let instances = [];

const config = {
  lines: { duration: 0.8, stagger: 0.08 },
  words: { duration: 0.6, stagger: 0.06 },
  chars: { duration: 0.4, stagger: 0.01 },
};

const typeMap = {
  lines: 'lines',
  words: 'lines, words',
  chars: 'lines, words, chars',
};

export function initSplitText(scope) {
  if (typeof SplitText === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  scope = scope || document;

  var headings = scope.querySelectorAll('[data-split="heading"]');
  if (!headings.length) return;

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  headings.forEach(function (heading) {
    // Unhide (FOUC prevention)
    gsap.set(heading, { autoAlpha: 1 });

    if (prefersReduced) return;

    var revealType = heading.getAttribute('data-split-reveal') || 'lines';
    if (!config[revealType]) revealType = 'lines';

    var splitType = typeMap[revealType];
    var defaults = config[revealType];
    var duration = parseFloat(heading.getAttribute('data-split-duration')) || defaults.duration;
    var stagger = parseFloat(heading.getAttribute('data-split-stagger')) || defaults.stagger;
    var start = heading.getAttribute('data-split-start') || 'top 80%';

    var split = SplitText.create(heading, {
      type: splitType,
      mask: 'lines',
      autoSplit: true,
      linesClass: 'split-line',
      wordsClass: 'split-word',
      charsClass: 'split-char',
      onSplit: function (instance) {
        var targets = instance[revealType];

        return gsap.from(targets, {
          yPercent: 110,
          duration: duration,
          stagger: stagger,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: heading,
            start: 'clamp(' + start + ')',
            once: true,
          },
        });
      },
    });

    instances.push(split);
  });
}

export function destroySplitText() {
  instances.forEach(function (split) {
    if (split && split.revert) split.revert();
  });
  instances = [];
}
