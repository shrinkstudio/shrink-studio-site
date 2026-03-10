// -----------------------------------------
// GSAP DRAGGABLE SLIDER
// Draggable + InertiaPlugin with CSS variable config
// Based on Osmo resource, adapted for init/destroy pattern
// -----------------------------------------

let instances = [];
let resizeHandler = null;
let resizeTimeout = null;
let lastWidth = window.innerWidth;

function initSlider(root) {
  // Kill existing instance if present
  if (root._sliderDraggable) {
    root._sliderDraggable.kill();
    root._sliderDraggable = null;
  }

  const collection = root.querySelector('[data-gsap-slider-collection]');
  const track = root.querySelector('[data-gsap-slider-list]');
  const items = Array.from(root.querySelectorAll('[data-gsap-slider-item]'));
  const controls = Array.from(root.querySelectorAll('[data-gsap-slider-control]'));

  if (!collection || !track || items.length === 0) return;

  // Inject aria attributes
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carousel');
  root.setAttribute('aria-label', 'Slider');
  collection.setAttribute('role', 'group');
  collection.setAttribute('aria-roledescription', 'Slides List');
  collection.setAttribute('aria-label', 'Slides');
  items.forEach((slide, i) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'Slide');
    slide.setAttribute('aria-label', `Slide ${i + 1} of ${items.length}`);
    slide.setAttribute('aria-hidden', 'true');
    slide.setAttribute('aria-selected', 'false');
    slide.setAttribute('tabindex', '-1');
  });
  controls.forEach((btn) => {
    const dir = btn.getAttribute('data-gsap-slider-control');
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', dir === 'prev' ? 'Previous Slide' : 'Next Slide');
    btn.disabled = true;
    btn.setAttribute('aria-disabled', 'true');
  });

  // Determine if slider should run via CSS custom properties
  const styles = getComputedStyle(root);
  const statusVar = styles.getPropertyValue('--slider-status').trim();
  let spvVar = parseFloat(styles.getPropertyValue('--slider-spv'));
  const rect = items[0].getBoundingClientRect();
  const marginRight = parseFloat(getComputedStyle(items[0]).marginRight);
  const slideW = rect.width + marginRight;

  if (isNaN(spvVar)) {
    spvVar = collection.clientWidth / slideW;
  }

  const spv = Math.max(1, Math.min(spvVar, items.length));
  const sliderEnabled = statusVar === 'on' && spv < items.length;
  root.setAttribute('data-gsap-slider-status', sliderEnabled ? 'active' : 'not-active');

  if (!sliderEnabled) {
    teardownSlider(root, collection, track, items, controls);
    return;
  }

  // Track hover state
  track.onmouseenter = () => {
    track.setAttribute('data-gsap-slider-list-status', 'grab');
  };
  track.onmouseleave = () => {
    track.removeAttribute('data-gsap-slider-list-status');
  };

  // Calculate bounds and snap points
  const vw = collection.clientWidth;
  const tw = track.scrollWidth;
  const maxScroll = Math.max(tw - vw, 0);
  const minX = -maxScroll;
  const maxX = 0;
  const maxIndex = maxScroll / slideW;
  const full = Math.floor(maxIndex);
  const snapPoints = [];

  for (let i = 0; i <= full; i++) {
    snapPoints.push(-i * slideW);
  }
  if (full < maxIndex) {
    snapPoints.push(-maxIndex * slideW);
  }

  let activeIndex = 0;
  const setX = gsap.quickSetter(track, 'x', 'px');
  let collectionRect = collection.getBoundingClientRect();

  function updateStatus(x) {
    if (x > maxX || x < minX) return;

    const calcX = x > maxX ? maxX : x < minX ? minX : x;
    let closest = snapPoints[0];
    snapPoints.forEach((pt) => {
      if (Math.abs(pt - calcX) < Math.abs(closest - calcX)) {
        closest = pt;
      }
    });
    activeIndex = snapPoints.indexOf(closest);

    // Update slide attributes
    items.forEach((slide, i) => {
      const r = slide.getBoundingClientRect();
      const leftEdge = r.left - collectionRect.left;
      const slideCenter = leftEdge + r.width / 2;
      const inView = slideCenter > 0 && slideCenter < collectionRect.width;
      const status = i === activeIndex ? 'active' : inView ? 'inview' : 'not-active';

      slide.setAttribute('data-gsap-slider-item-status', status);
      slide.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
      slide.setAttribute('aria-hidden', inView ? 'false' : 'true');
      slide.setAttribute('tabindex', i === activeIndex ? '0' : '-1');
    });

    // Update controls
    controls.forEach((btn) => {
      const dir = btn.getAttribute('data-gsap-slider-control');
      const can =
        dir === 'prev' ? activeIndex > 0 : activeIndex < snapPoints.length - 1;

      btn.disabled = !can;
      btn.setAttribute('aria-disabled', can ? 'false' : 'true');
      btn.setAttribute('data-gsap-slider-control-status', can ? 'active' : 'not-active');
    });
  }

  // Control click handlers
  controls.forEach((btn) => {
    const dir = btn.getAttribute('data-gsap-slider-control');
    btn._gsapSliderClick = () => {
      if (btn.disabled) return;
      const delta = dir === 'next' ? 1 : -1;
      const target = activeIndex + delta;
      gsap.to(track, {
        duration: 0.4,
        x: snapPoints[target],
        onUpdate: () => updateStatus(gsap.getProperty(track, 'x')),
      });
    };
    btn.addEventListener('click', btn._gsapSliderClick);
  });

  // Initialize Draggable
  root._sliderDraggable = Draggable.create(track, {
    type: 'x',
    inertia: true,
    bounds: { minX, maxX },
    throwResistance: 2000,
    dragResistance: 0.05,
    maxDuration: 0.6,
    minDuration: 0.2,
    edgeResistance: 0.75,
    snap: { x: snapPoints, duration: 0.4 },
    onPress() {
      track.setAttribute('data-gsap-slider-list-status', 'grabbing');
      collectionRect = collection.getBoundingClientRect();
    },
    onDrag() {
      setX(this.x);
      updateStatus(this.x);
    },
    onThrowUpdate() {
      setX(this.x);
      updateStatus(this.x);
    },
    onThrowComplete() {
      setX(this.endX);
      updateStatus(this.endX);
      track.setAttribute('data-gsap-slider-list-status', 'grab');
    },
    onRelease() {
      setX(this.x);
      updateStatus(this.x);
      track.setAttribute('data-gsap-slider-list-status', 'grab');
    },
  })[0];

  // Initial state
  setX(0);
  updateStatus(0);
}

function teardownSlider(root, collection, track, items, controls) {
  track.removeAttribute('style');
  track.onmouseenter = null;
  track.onmouseleave = null;
  track.removeAttribute('data-gsap-slider-list-status');

  root.removeAttribute('role');
  root.removeAttribute('aria-roledescription');
  root.removeAttribute('aria-label');
  collection.removeAttribute('role');
  collection.removeAttribute('aria-roledescription');
  collection.removeAttribute('aria-label');

  items.forEach((slide) => {
    slide.removeAttribute('role');
    slide.removeAttribute('aria-roledescription');
    slide.removeAttribute('aria-label');
    slide.removeAttribute('aria-hidden');
    slide.removeAttribute('aria-selected');
    slide.removeAttribute('tabindex');
    slide.removeAttribute('data-gsap-slider-item-status');
  });

  controls.forEach((btn) => {
    btn.disabled = false;
    btn.removeAttribute('role');
    btn.removeAttribute('aria-label');
    btn.removeAttribute('aria-disabled');
    btn.removeAttribute('data-gsap-slider-control-status');
  });
}

export function initGsapSliders(scope) {
  if (typeof Draggable === 'undefined') return;

  scope = scope || document;
  const roots = scope.querySelectorAll('[data-gsap-slider-init]');
  if (roots.length === 0) return;

  roots.forEach((root) => {
    initSlider(root);
    instances.push(root);
  });

  // Resize handler — reinit on width change
  if (!resizeHandler) {
    resizeHandler = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const currentWidth = window.innerWidth;
        if (currentWidth !== lastWidth) {
          lastWidth = currentWidth;
          instances.forEach((root) => {
            if (root.isConnected) initSlider(root);
          });
        }
      }, 200);
    };
    window.addEventListener('resize', resizeHandler);
  }
}

export function destroyGsapSliders() {
  instances.forEach((root) => {
    if (root._sliderDraggable) {
      root._sliderDraggable.kill();
      root._sliderDraggable = null;
    }

    const collection = root.querySelector('[data-gsap-slider-collection]');
    const track = root.querySelector('[data-gsap-slider-list]');
    const items = Array.from(root.querySelectorAll('[data-gsap-slider-item]'));
    const controls = Array.from(root.querySelectorAll('[data-gsap-slider-control]'));

    if (collection && track) {
      teardownSlider(root, collection, track, items, controls);
    }

    // Remove click handlers
    controls.forEach((btn) => {
      if (btn._gsapSliderClick) {
        btn.removeEventListener('click', btn._gsapSliderClick);
        delete btn._gsapSliderClick;
      }
    });

    root.removeAttribute('data-gsap-slider-status');
  });

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
