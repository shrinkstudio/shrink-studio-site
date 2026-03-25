// -----------------------------------------
// SHRINK STUDIO — PAGE TRANSITION BOILERPLATE
// Barba.js + GSAP + Lenis + Parallax Slide Transition
// -----------------------------------------

import { initThemeToggle } from './theme-toggle.js';
import { initAccordions, destroyAccordions } from './accordion.js';
import { initTabs, destroyTabs } from './tabs.js';
import { initSliders, destroySliders } from './slider.js';
import { initInlineVideos, destroyInlineVideos } from './inline-video.js';
import { initModalDelegation, initModals, destroyModals } from './modal.js';
import { initFontSizeDetect, initFooterYear, initSkipLink } from './utilities.js';
import { initNavScrollHide, destroyNavScrollHide } from './nav.js';
import { initBunnyBackground, destroyBunnyBackground } from './bunny-video.js';
import { initParallax, destroyParallax } from './parallax.js';
import { initStackingCards, destroyStackingCards } from './stacking-cards.js';
import { initHoverList, destroyHoverList } from './hover-list.js';
import { initProjectList, destroyProjectList } from './project-list.js';
import { initCurrentTime, destroyCurrentTime } from './current-time.js';
import { initMagneticButtons, destroyMagneticButtons } from './magnetic-button.js';
import { initFooterParallax, destroyFooterParallax } from './footer-parallax.js';
import { initCustomCursor, destroyCustomCursor } from './custom-cursor.js';
import { initGsapSliders, destroyGsapSliders } from './gsap-slider.js';
import { initCopyClip, destroyCopyClip } from './copy-clip.js';
import { initFormValidation, destroyFormValidation } from './form-validate.js';
import { initCmsNest, destroyCmsNest } from './cms-nest.js';
import { initServiceHover, destroyServiceHover } from './service-hover.js';
import { initTestimonialSlider, destroyTestimonialSlider } from './testimonial-slider.js';
import { initWordScatter, destroyWordScatter } from './word-scatter.js';

gsap.registerPlugin(CustomEase);
if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
if (typeof Flip !== 'undefined') gsap.registerPlugin(Flip);
if (typeof Draggable !== 'undefined') gsap.registerPlugin(Draggable);
if (typeof InertiaPlugin !== 'undefined') gsap.registerPlugin(InertiaPlugin);
if (typeof Observer !== 'undefined') gsap.registerPlugin(Observer);
if (typeof SplitText !== 'undefined') gsap.registerPlugin(SplitText);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));
rmMQ.addListener?.(e => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);

CustomEase.create("parallax", "0.76, 0, 0.24, 1");
gsap.defaults({ ease: "parallax", duration: 0.6 });


// -----------------------------------------
// FUNCTION REGISTRY
// -----------------------------------------

function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  // Document-level delegation (bind once)
  initModalDelegation();
  initFontSizeDetect();
  initSkipLink();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  // Destroy old instances before new page enters
  destroyNavScrollHide();
  destroyAccordions();
  destroyTabs();
  destroySliders();
  destroyInlineVideos();
  destroyBunnyBackground();
  destroyParallax();
  destroyStackingCards();
  destroyModals();
  destroyHoverList();
  destroyProjectList();
  destroyCurrentTime();
  destroyMagneticButtons();
  destroyFooterParallax();
  destroyCustomCursor();
  destroyGsapSliders();
  destroyCopyClip();
  destroyFormValidation();
  destroyCmsNest();
  destroyServiceHover();
  destroyTestimonialSlider();
  destroyWordScatter();
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  // Nav is inside the barba container — scope to document so we find it after transition
  if (document.querySelector('.nav'))               initNavScrollHide(document);
  if (has('[data-theme-toggle]'))                   initThemeToggle(nextPage);
  if (has('details'))                               initAccordions(nextPage);
  if (has('[data-tabs-component]'))                 initTabs(nextPage);
  if (has('[data-slider]'))                         initSliders(nextPage);
  if (has('[data-video]'))                          initInlineVideos(nextPage);
  if (has('[data-bunny-background-init]'))          initBunnyBackground(nextPage);
  if (has('dialog'))                                initModals(nextPage);
  if (has('[data-parallax="trigger"]'))             initParallax(nextPage);
  if (has('[data-stacking-cards-item]'))            initStackingCards(nextPage);
  if (has('[data-hover-list]'))                     initHoverList(nextPage);
  if (has('[data-project-list]'))                   initProjectList(nextPage);
  if (has('[data-current-time]'))                   initCurrentTime(nextPage);
  if (has('[data-magnetic-strength]'))              initMagneticButtons(nextPage);
  if (has('[data-footer-parallax]'))                initFooterParallax(nextPage);
  if (nextPage.querySelector('.cursor'))            initCustomCursor(nextPage);
  if (has('[data-gsap-slider-init]'))               initGsapSliders(nextPage);
  if (has('[data-copy="trigger"]'))                 initCopyClip(nextPage);
  if (has('[data-form-validate]'))                  initFormValidation(nextPage);
  if (has('[data-nest="target"]'))                  initCmsNest(nextPage);
  if (has('[data-service-hover]'))                  initServiceHover(nextPage);
  if (has('[data-testimonial-wrap]'))               initTestimonialSlider(nextPage);
  if (has('[data-highlight-text]'))                  initWordScatter(nextPage);
  if (has('[data-footer-year]'))                    initFooterYear(nextPage);

  // Re-evaluate inline scripts inside the new container (Webflow embeds)
  reinitScripts(nextPage);

  // Re-trigger Webflow Code Components (e.g. Dither Background)
  reinitWebflowComponents();

  // Webflow IX2 reinit — fixes native nav dropdowns
  if (window.Webflow && window.Webflow.ready) {
    window.Webflow.ready();
  }

  if (hasLenis) {
    lenis.resize();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
}


// -----------------------------------------
// PAGE TRANSITIONS (Parallax Slide)
// -----------------------------------------

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  tl.call(() => {
    resetPage(next);
  }, null, 0);

  return tl;
}

function runPageLeaveAnimation(current, next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionDark = transitionWrap ? transitionWrap.querySelector("[data-transition-dark]") : null;

  // Capture scroll position and reset
  const scrollY = window.scrollY || 0;
  window.scrollTo(0, 0);

  // Position current page fixed at scroll offset
  gsap.set(current, {
    position: "fixed",
    top: -scrollY,
    left: 0,
    width: "100%",
    zIndex: 1,
    willChange: "transform",
  });

  // Show transition overlay between current and next
  if (transitionWrap) {
    gsap.set(transitionWrap, {
      autoAlpha: 1,
      pointerEvents: "auto",
      zIndex: 2,
    });
  }

  if (transitionDark) {
    gsap.set(transitionDark, { opacity: 0 });
  }

  // Position new page below
  gsap.set(next, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    zIndex: 3,
    willChange: "transform",
    y: "100vh",
  });

  const tl = gsap.timeline({
    onComplete: () => {
      // Clean up current page
      gsap.set(current, { autoAlpha: 0 });

      // Hide transition overlay
      if (transitionWrap) {
        gsap.set(transitionWrap, { autoAlpha: 0, pointerEvents: "none", zIndex: -1 });
      }
      if (transitionDark) {
        gsap.set(transitionDark, { clearProps: "opacity" });
      }

      // Clear transforms on next page
      gsap.set(next, { clearProps: "position,top,left,width,zIndex,willChange,y" });
    },
  });

  if (reducedMotion) {
    return tl.set(current, { autoAlpha: 0 });
  }

  // Current page slides up (parallax — shorter distance)
  tl.to(current, {
    y: "-25vh",
    duration: 1.2,
    ease: "parallax",
  }, 0);

  // Dark overlay fades in over current page
  if (transitionDark) {
    tl.to(transitionDark, {
      opacity: 0.8,
      duration: 1.2,
      ease: "parallax",
    }, 0);
  }

  // New page slides up from below
  tl.to(next, {
    y: "0vh",
    duration: 1.2,
    ease: "parallax",
  }, 0);

  return tl;
}

function runPageEnterAnimation(next) {
  const tl = gsap.timeline();

  if (reducedMotion) {
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  // Leave animation handles everything in sync mode
  tl.add("pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}


// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

barba.hooks.beforeEnter(data => {
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }

  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if (hasScrollTrigger) {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
});

barba.hooks.enter(data => {
  initBarbaNavUpdate(data);
});

barba.hooks.afterEnter(data => {
  initAfterEnterFunctions(data.next.container);

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
});

barba.init({
  debug: false,
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "default",
      sync: true,

      async once(data) {
        initOnceFunctions();
        return runPageOnceAnimation(data.next.container);
      },

      async leave(data) {
        return runPageLeaveAnimation(data.current.container, data.next.container);
      },

      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      }
    }
  ],
});


// -----------------------------------------
// GENERIC + HELPERS
// -----------------------------------------

const themeConfig = {
  light: {
    nav: "dark",
    transition: "light"
  },
  dark: {
    nav: "light",
    transition: "dark"
  }
};

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;

  document.body.dataset.pageTheme = pageTheme;
  const transitionEl = document.querySelector('[data-theme-transition]');
  if (transitionEl) {
    transitionEl.dataset.themeTransition = config.transition;
  }

  const nav = document.querySelector('[data-theme-nav]');
  if (nav) {
    nav.dataset.themeNav = config.nav;
  }
}

function initLenis() {
  if (lenis) return;
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: 0.165,
    wheelMultiplier: 1.25,
  });

  // Expose for nav scroll hide and other scripts
  window.__shrinkLenis = lenis;

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }
}

function reinitScripts(container) {
  container.querySelectorAll('script').forEach(oldScript => {
    const newScript = document.createElement('script');
    [...oldScript.attributes].forEach(attr => {
      newScript.setAttribute(attr.name, attr.value);
    });
    newScript.textContent = oldScript.textContent;
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

let componentScriptSrc = null;

function reinitWebflowComponents() {
  // On first run, find and cache the Code Component script src
  if (!componentScriptSrc) {
    const script = document.querySelector('script[src*="shrink_studio_scripts"]');
    if (script) componentScriptSrc = script.src;
  }

  if (!componentScriptSrc) return;

  // Remove any existing Code Component script
  document.querySelectorAll('script[src*="shrink_studio_scripts"]').forEach(s => s.remove());

  // Re-inject into head so it re-executes and mounts components in the new container
  const newScript = document.createElement('script');
  newScript.src = componentScriptSrc;
  document.head.appendChild(newScript);
}

function initBarbaNavUpdate(data) {
  var tpl = document.createElement('template');
  tpl.innerHTML = data.next.html.trim();
  var nextNodes = tpl.content.querySelectorAll('[data-barba-update]');
  var currentNodes = document.querySelectorAll('nav [data-barba-update]');

  currentNodes.forEach(function (curr, index) {
    var next = nextNodes[index];
    if (!next) return;

    var newStatus = next.getAttribute('aria-current');
    if (newStatus !== null) {
      curr.setAttribute('aria-current', newStatus);
    } else {
      curr.removeAttribute('aria-current');
    }

    var newClassList = next.getAttribute('class') || '';
    curr.setAttribute('class', newClassList);
  });
}
