// -----------------------------------------
// WORD SCATTER — Scroll-driven word drift
// Wraps words in spans, randomly assigns drift
// directions, animates with ScrollTrigger scrub
// -----------------------------------------
// Attributes:
//   [data-word-scatter]            — root wrapper
//   [data-word-scatter-text]       — paragraph/text element to split
//   [data-word-scatter-intensity]  — optional multiplier (default: 1)

let instances = [];

const driftConfig = [
  { pad: '0.8em', x: '-0.8em' },
  { pad: '1.6em', x: '1.6em' },
  { pad: '2.4em', x: '-2.4em' },
];

function initWordScatter(scope) {
  scope = scope || document;
  var roots = scope.querySelectorAll('[data-word-scatter]');
  if (!roots.length) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  roots.forEach(function (root) {
    var textEl = root.querySelector('[data-word-scatter-text]');
    if (!textEl) return;

    var intensity = parseFloat(root.getAttribute('data-word-scatter-intensity')) || 1;

    // Wrap each word in a span
    var text = textEl.textContent;
    textEl.innerHTML = text
      .split(' ')
      .map(function (word) { return '<span style="display:inline-block">' + word + '</span>'; })
      .join(' ');

    var words = textEl.querySelectorAll('span');
    var triggers = [];

    words.forEach(function (word) {
      // Randomly assign a drift group (0 = no drift, 1-3 = drift)
      var group = Math.floor(Math.random() * 4);
      if (group === 0) return;

      var config = driftConfig[group - 1];
      var padDir = parseFloat(config.x) < 0 ? 'padding-left' : 'padding-right';
      var padAmount = parseFloat(config.pad) * intensity + 'em';

      word.style[padDir] = padAmount;
      word.style.willChange = 'transform';
      word.setAttribute('data-word-scatter-group', group);

      var xVal = parseFloat(config.x) * intensity + 'em';

      gsap.to(word, {
        x: xVal,
        ease: 'none',
        scrollTrigger: {
          trigger: word,
          start: 'top 80%',
          end: 'bottom 60%',
          scrub: 0.2,
        },
      });

      var st = ScrollTrigger.getAll();
      triggers.push(st[st.length - 1]);
    });

    instances.push({ root: root, textEl: textEl, originalText: text, triggers: triggers });
  });
}

function destroyWordScatter() {
  instances.forEach(function (inst) {
    // Kill ScrollTriggers
    inst.triggers.forEach(function (st) { st.kill(); });

    // Restore original text
    inst.textEl.textContent = inst.originalText;
  });
  instances = [];
}

export { initWordScatter, destroyWordScatter };
