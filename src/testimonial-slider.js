// -----------------------------------------
// TESTIMONIAL SLIDER (Osmo Line Reveal)
// SplitText line animations + clip-path image reveal
// CMS-compatible: always starts at index 0 (ignores .is--active)
// -----------------------------------------

let initializedComponents = [];

function initTestimonialComponent(wrap) {
  if (typeof SplitText === 'undefined') return;

  const list = wrap.querySelector('[data-testimonial-list]');
  if (!list) return;

  const items = Array.from(list.querySelectorAll('[data-testimonial-item]'));
  if (!items.length) return;

  const btnPrev = wrap.querySelector('[data-prev]');
  const btnNext = wrap.querySelector('[data-next]');
  const elCurrent = wrap.querySelector('[data-current]');
  const elTotal = wrap.querySelector('[data-total]');

  if (elTotal) elTotal.textContent = String(items.length);

  // CMS: always start at 0 — strip any designer .is--active
  let activeIndex = 0;

  let isAnimating = false;
  let reduceMotion = false;

  const autoplayEnabled = wrap.getAttribute('data-autoplay') === 'true';
  const autoplayDuration = parseInt(wrap.getAttribute('data-autoplay-duration'), 10) || 4000;

  let autoplayCall = null;
  let isInView = true;
  let scrollTriggerInstance = null;
  let matchMediaCtx = null;

  const eventListeners = [];

  const slides = items.map((item) => ({
    item,
    image: item.querySelector('[data-testimonial-img]'),
    splitTargets: [
      item.querySelector('[data-testimonial-text]'),
      ...item.querySelectorAll('[data-testimonial-split]'),
    ].filter(Boolean),
    splitInstances: [],
    getLines() {
      return this.splitInstances.flatMap((instance) => instance.lines);
    },
  }));

  function setSlideState(slideIndex, isActive) {
    const { item } = slides[slideIndex];
    item.classList.toggle('is--active', isActive);
    item.setAttribute('aria-hidden', String(!isActive));
    gsap.set(item, {
      autoAlpha: isActive ? 1 : 0,
      pointerEvents: isActive ? 'auto' : 'none',
    });
  }

  function updateCounter() {
    if (elCurrent) elCurrent.textContent = String(activeIndex + 1);
  }

  function startAutoplay() {
    if (!autoplayEnabled) return;
    if (autoplayCall) autoplayCall.kill();

    autoplayCall = gsap.delayedCall(autoplayDuration / 1000, () => {
      if (!isInView || isAnimating) {
        startAutoplay();
        return;
      }
      goTo((activeIndex + 1) % slides.length);
      startAutoplay();
    });
  }

  function pauseAutoplay() {
    if (autoplayCall) autoplayCall.pause();
  }

  function resumeAutoplay() {
    if (!autoplayEnabled) return;
    if (!autoplayCall) startAutoplay();
    else autoplayCall.resume();
  }

  function resetAutoplay() {
    if (!autoplayEnabled) return;
    startAutoplay();
  }

  // Set initial state
  slides.forEach((_, i) => setSlideState(i, i === activeIndex));
  updateCounter();

  // Reduced motion
  matchMediaCtx = gsap.matchMedia();
  matchMediaCtx.add(
    { reduce: '(prefers-reduced-motion: reduce)' },
    (context) => {
      reduceMotion = context.conditions.reduce;
    }
  );

  // Create SplitText instances
  slides.forEach((slide, slideIndex) => {
    slide.splitInstances = slide.splitTargets.map((el) =>
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'text-line',
        autoSplit: true,
        onSplit(self) {
          if (reduceMotion) return;

          const isActive = slideIndex === activeIndex;
          gsap.set(self.lines, { yPercent: isActive ? 0 : 110 });

          if (slide.image) {
            gsap.set(slide.image, {
              autoAlpha: isActive ? 1 : 0,
            });
          }
        },
      })
    );
  });

  function goTo(nextIndex) {
    if (isAnimating || nextIndex === activeIndex) return;
    isAnimating = true;

    const outgoingSlide = slides[activeIndex];
    const incomingSlide = slides[nextIndex];

    const tl = gsap.timeline({
      onComplete: () => {
        setSlideState(activeIndex, false);
        setSlideState(nextIndex, true);
        activeIndex = nextIndex;
        updateCounter();
        isAnimating = false;
      },
    });

    if (reduceMotion) {
      tl.to(outgoingSlide.item, {
        autoAlpha: 0,
        duration: 0.4,
        ease: 'power2',
      }, 0)
        .fromTo(incomingSlide.item, { autoAlpha: 0 }, {
          autoAlpha: 1,
          duration: 0.4,
          ease: 'power2',
        }, 0);

      return;
    }

    const outgoingLines = outgoingSlide.getLines();
    const incomingLines = incomingSlide.getLines();

    gsap.set(incomingSlide.item, { autoAlpha: 1, pointerEvents: 'auto' });
    gsap.set(incomingLines, { yPercent: 110 });

    if (incomingSlide.image) gsap.set(incomingSlide.image, { autoAlpha: 0 });
    if (outgoingSlide.image) gsap.set(outgoingSlide.image, { autoAlpha: 1 });

    tl.to(outgoingLines, {
      yPercent: -110,
      duration: 0.6,
      ease: 'power4.inOut',
      stagger: { amount: 0.25 },
    }, 0);

    if (outgoingSlide.image) {
      tl.to(outgoingSlide.image, {
        autoAlpha: 0,
        duration: 0.5,
        ease: 'power2.inOut',
      }, 0);
    }

    tl.to(incomingLines, {
      yPercent: 0,
      duration: 0.7,
      ease: 'power4.inOut',
      stagger: { amount: 0.4 },
    }, '>-=0.3');

    if (incomingSlide.image) {
      tl.to(incomingSlide.image, {
        autoAlpha: 1,
        duration: 0.5,
        ease: 'power2.inOut',
      }, '<');
    }

    tl.set(outgoingSlide.item, { autoAlpha: 0 }, '>');
  }

  // Autoplay
  startAutoplay();

  // Nav buttons
  if (btnNext) {
    const nextHandler = () => {
      resetAutoplay();
      goTo((activeIndex + 1) % slides.length);
    };
    btnNext.addEventListener('click', nextHandler);
    eventListeners.push({ element: btnNext, type: 'click', handler: nextHandler });
  }

  if (btnPrev) {
    const prevHandler = () => {
      resetAutoplay();
      goTo((activeIndex - 1 + slides.length) % slides.length);
    };
    btnPrev.addEventListener('click', prevHandler);
    eventListeners.push({ element: btnPrev, type: 'click', handler: prevHandler });
  }

  // Keyboard nav
  const onKeyDown = (e) => {
    if (!isInView) return;

    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      resetAutoplay();
      goTo((activeIndex + 1) % slides.length);
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      resetAutoplay();
      goTo((activeIndex - 1 + slides.length) % slides.length);
    }
  };

  window.addEventListener('keydown', onKeyDown);
  eventListeners.push({ element: window, type: 'keydown', handler: onKeyDown });

  // ScrollTrigger visibility
  if (typeof ScrollTrigger !== 'undefined') {
    scrollTriggerInstance = ScrollTrigger.create({
      trigger: wrap,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => { isInView = true; resumeAutoplay(); },
      onEnterBack: () => { isInView = true; resumeAutoplay(); },
      onLeave: () => { isInView = false; pauseAutoplay(); },
      onLeaveBack: () => { isInView = false; pauseAutoplay(); },
    });
  }

  // Cleanup
  function cleanup() {
    eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    if (autoplayCall) autoplayCall.kill();
    if (scrollTriggerInstance) scrollTriggerInstance.kill();
    if (matchMediaCtx) matchMediaCtx.revert();
    slides.forEach((slide) => {
      slide.splitInstances.forEach((instance) => instance.revert());
    });
  }

  wrap.__testimonialCleanup = cleanup;
  initializedComponents.push(wrap);
}

export function initTestimonialSlider(scope) {
  scope = scope || document;
  const wraps = scope.querySelectorAll('[data-testimonial-wrap]');
  if (!wraps.length) return;
  wraps.forEach(initTestimonialComponent);
}

export function destroyTestimonialSlider() {
  initializedComponents.forEach((wrap) => {
    if (wrap.__testimonialCleanup) {
      wrap.__testimonialCleanup();
      delete wrap.__testimonialCleanup;
    }
  });
  initializedComponents = [];
}
