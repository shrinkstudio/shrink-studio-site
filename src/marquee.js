// -----------------------------------------
// GSAP MARQUEE — Infinite auto-scroll + drag
// Observer + quickTo pattern, init/destroy lifecycle
// -----------------------------------------

let instances = [];
let resizeHandler = null;
let resizeTimeout = null;

function initMarquee(root) {
  const track = root.querySelector('[data-marquee-track]');
  const origItems = Array.from(root.querySelectorAll('[data-marquee-item]'));

  if (!track || origItems.length === 0) return;

  // Read config from data attributes
  const speed = parseFloat(root.getAttribute('data-marquee-speed')) || 1;
  const direction = root.getAttribute('data-marquee-direction') === 'right' ? 1 : -1;
  const dragEnabled = root.getAttribute('data-marquee-drag') !== 'false';
  const hoverPause = root.getAttribute('data-marquee-hover-pause') === 'true';

  // Clone items for seamless loop
  const clones = origItems.map(item => {
    const clone = item.cloneNode(true);
    clone.setAttribute('data-marquee-clone', '');
    track.appendChild(clone);
    return clone;
  });

  const allItems = [...origItems, ...clones];

  // Measure half-width (original items only) for wrap point
  let halfWidth = 0;
  origItems.forEach(item => {
    halfWidth += item.offsetWidth;
  });
  // Add gap: read computed gap from track
  const trackGap = parseFloat(getComputedStyle(track).columnGap) || 0;
  halfWidth += trackGap * origItems.length;

  // State
  let xPos = 0;
  let paused = false;
  let observer = null;
  let dragTl = null;

  const wrap = gsap.utils.wrap(-halfWidth, 0);
  const setX = gsap.quickSetter(track, 'x', 'px');

  // Base speed: pixels per second (60px/s * multiplier)
  const baseSpeed = 60 * speed;

  // Ticker callback — auto-scroll
  function tickerUpdate(time, deltaTime) {
    if (paused) return;
    // deltaTime is in ms from GSAP ticker
    const dt = deltaTime / 1000;
    xPos += baseSpeed * direction * dt;
    xPos = wrap(xPos);
    setX(xPos);
  }

  gsap.ticker.add(tickerUpdate);

  // Drag via Observer
  if (dragEnabled && typeof Observer !== 'undefined') {
    observer = Observer.create({
      target: root,
      type: 'pointer,touch',
      dragMinimum: 3,
      onPress() {
        // Pause auto-scroll while dragging
        paused = true;
        track.style.cursor = 'grabbing';
      },
      onDrag(self) {
        xPos += self.deltaX;
        xPos = wrap(xPos);
        setX(xPos);

        // Subtle random card animation on drag
        if (dragTl) dragTl.kill();
        dragTl = gsap.timeline();

        allItems.forEach(item => {
          dragTl.to(item, {
            rotation: gsap.utils.random(-8, 8),
            xPercent: gsap.utils.random(-3, 3),
            yPercent: gsap.utils.random(-3, 3),
            scale: gsap.utils.random(0.98, 1),
            duration: 0.6,
            ease: 'back.inOut(2)',
            overwrite: true,
          }, 0);
        });
      },
      onRelease() {
        paused = false;
        track.style.cursor = '';

        // Reset card transforms
        if (dragTl) dragTl.kill();
        dragTl = gsap.timeline();

        allItems.forEach(item => {
          dragTl.to(item, {
            rotation: 0,
            xPercent: 0,
            yPercent: 0,
            scale: 1,
            duration: 0.8,
            ease: 'back.out(2)',
            overwrite: true,
          }, 0);
        });
      },
    });
  }

  // Hover pause
  let hoverEnter = null;
  let hoverLeave = null;

  if (hoverPause) {
    hoverEnter = () => { paused = true; };
    hoverLeave = () => { paused = false; };
    root.addEventListener('mouseenter', hoverEnter);
    root.addEventListener('mouseleave', hoverLeave);
  }

  // Store cleanup data on the root element
  root._marquee = {
    tickerUpdate,
    observer,
    clones,
    hoverEnter,
    hoverLeave,
    allItems,
    get dragTl() { return dragTl; },
  };
}

function destroyMarquee(root) {
  const m = root._marquee;
  if (!m) return;

  // Remove ticker
  gsap.ticker.remove(m.tickerUpdate);

  // Kill Observer
  if (m.observer) m.observer.kill();

  // Kill drag timeline
  if (m.dragTl) m.dragTl.kill();

  // Remove hover listeners
  if (m.hoverEnter) root.removeEventListener('mouseenter', m.hoverEnter);
  if (m.hoverLeave) root.removeEventListener('mouseleave', m.hoverLeave);

  // Clear inline styles on items
  m.allItems.forEach(item => {
    gsap.set(item, { clearProps: 'rotation,xPercent,yPercent,scale' });
  });

  // Remove cloned items
  m.clones.forEach(clone => clone.remove());

  // Clear track inline styles
  const track = root.querySelector('[data-marquee-track]');
  if (track) {
    track.style.transform = '';
    track.style.cursor = '';
  }

  delete root._marquee;
}

export function initMarquees(scope) {
  if (typeof Observer === 'undefined') {
    // Observer is needed; register if available
    if (typeof window.Observer !== 'undefined') {
      gsap.registerPlugin(Observer);
    }
  }

  scope = scope || document;
  const roots = scope.querySelectorAll('[data-marquee-init]');
  if (roots.length === 0) return;

  roots.forEach(root => {
    initMarquee(root);
    instances.push(root);
  });

  // Resize handler — recalculate on width change
  if (!resizeHandler) {
    resizeHandler = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        instances.forEach(root => {
          if (root.isConnected) {
            destroyMarquee(root);
            initMarquee(root);
          }
        });
      }, 200);
    };
    window.addEventListener('resize', resizeHandler);
  }
}

export function destroyMarquees() {
  instances.forEach(root => destroyMarquee(root));
  instances = [];

  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }

  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
    resizeTimeout = null;
  }
}
