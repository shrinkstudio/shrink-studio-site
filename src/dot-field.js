// -----------------------------------------
// SHRINK STUDIO — DOT FIELD BACKGROUND
// Vanilla port of ReactBits DotField component
// Canvas 2D dots + SVG glow, init/destroy pattern
// -----------------------------------------

const TWO_PI = Math.PI * 2;

let instances = [];

export function initDotField(scope = document) {
  const els = scope.querySelectorAll('[data-dot-field]');
  if (!els.length) return;

  els.forEach(el => {
    try {
      instances.push(createInstance(el));
    } catch (e) {
      console.warn('[DotField] init failed:', e);
    }
  });
}

export function destroyDotField() {
  instances.forEach(inst => {
    cancelAnimationFrame(inst.raf);
    clearInterval(inst.speedInterval);
    inst.ro.disconnect();
    window.removeEventListener('mousemove', inst.onMouseMove);
    inst.canvas.remove();
    inst.svg.remove();
  });
  instances = [];
}

function createInstance(el) {
  const d = el.dataset;

  const cfg = {
    dotRadius:     parseFloat(d.dotRadius)      || 1.5,
    dotSpacing:    parseFloat(d.dotSpacing)      || 14,
    cursorRadius:  parseFloat(d.dotCursorRadius) || 500,
    cursorForce:   parseFloat(d.dotCursorForce)  || 0.1,
    bulgeOnly:     d.dotBulgeOnly !== 'false',
    bulgeStrength: parseFloat(d.dotBulgeStrength)|| 67,
    glowRadius:    parseFloat(d.dotGlowRadius)   || 160,
    sparkle:       d.dotSparkle === 'true',
    waveAmplitude: parseFloat(d.dotWaveAmplitude)|| 0,
    gradientFrom:  d.dotFrom                     || 'rgba(168, 85, 247, 0.35)',
    gradientTo:    d.dotTo                       || 'rgba(180, 151, 207, 0.25)',
    glowColor:     d.dotGlowColor                || '#120F17',
    fadeTop:       parseFloat(d.dotFadeTop)      || 0,
    fadeBottom:    parseFloat(d.dotFadeBottom)    || 0,
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----- Canvas -----
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity 0.6s ease;';

  // ----- SVG glow -----
  const glowId = `dot-field-glow-${Math.random().toString(36).slice(2, 9)}`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity 0.6s ease;');

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const radGrad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
  radGrad.setAttribute('id', glowId);
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', cfg.glowColor);
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', 'transparent');
  radGrad.appendChild(stop1);
  radGrad.appendChild(stop2);
  defs.appendChild(radGrad);
  svg.appendChild(defs);

  const glowCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  glowCircle.setAttribute('cx', '-9999');
  glowCircle.setAttribute('cy', '-9999');
  glowCircle.setAttribute('r', cfg.glowRadius);
  glowCircle.setAttribute('fill', `url(#${glowId})`);
  glowCircle.style.opacity = '0';
  glowCircle.style.willChange = 'opacity';
  svg.appendChild(glowCircle);

  el.style.position = 'relative';
  el.style.overflow = 'hidden';
  el.insertBefore(svg, el.firstChild);
  el.insertBefore(canvas, el.firstChild);

  // Edge fade via CSS mask
  if (cfg.fadeTop > 0 || cfg.fadeBottom > 0) {
    const top = cfg.fadeTop * 100;
    const bottom = cfg.fadeBottom * 100;
    const mask = `linear-gradient(to bottom, transparent 0%, black ${top}%, black ${100 - bottom}%, transparent 100%)`;
    canvas.style.maskImage = mask;
    canvas.style.webkitMaskImage = mask;
    svg.style.maskImage = mask;
    svg.style.webkitMaskImage = mask;
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // ----- State -----
  const mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
  const size = { w: 0, h: 0, offsetX: 0, offsetY: 0 };
  let dots = [];
  let engagement = 0;
  let glowOpacity = 0;
  let frameCount = 0;
  let revealed = false;
  let resizeTimer;

  // ----- Grid -----
  function buildDots(w, h) {
    const step = cfg.dotRadius + cfg.dotSpacing;
    const cols = Math.floor(w / step);
    const rows = Math.floor(h / step);
    const padX = (w % step) / 2;
    const padY = (h % step) / 2;
    dots = new Array(rows * cols);
    let idx = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ax = padX + col * step + step / 2;
        const ay = padY + row * step + step / 2;
        dots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
      }
    }
  }

  // ----- Resize -----
  function doResize() {
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w === 0 || h === 0) return;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    size.w = w;
    size.h = h;
    size.offsetX = rect.left + window.scrollX;
    size.offsetY = rect.top + window.scrollY;

    buildDots(w, h);
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(doResize, 100);
  }

  // ----- Mouse -----
  const onMouseMove = (e) => {
    mouse.x = e.pageX - size.offsetX;
    mouse.y = e.pageY - size.offsetY;
  };

  function updateMouseSpeed() {
    const dx = mouse.prevX - mouse.x;
    const dy = mouse.prevY - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    mouse.speed += (dist - mouse.speed) * 0.5;
    if (mouse.speed < 0.001) mouse.speed = 0;
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
  }

  const speedInterval = setInterval(updateMouseSpeed, 20);

  // ----- Render loop -----
  let raf = 0;

  function tick() {
    raf = requestAnimationFrame(tick);
    frameCount++;

    const { w, h } = size;
    const len = dots.length;
    if (w === 0 || h === 0 || len === 0) return;

    const t = frameCount * 0.02;

    // Engagement
    const targetEngagement = Math.min(mouse.speed / 5, 1);
    engagement += (targetEngagement - engagement) * 0.06;
    if (engagement < 0.001) engagement = 0;
    const eng = engagement;

    // Glow
    glowOpacity += (eng - glowOpacity) * 0.08;
    glowCircle.setAttribute('cx', mouse.x);
    glowCircle.setAttribute('cy', mouse.y);
    glowCircle.style.opacity = glowOpacity;

    // Skip after first frame on reduced motion
    if (reducedMotion && revealed) return;

    ctx.clearRect(0, 0, w, h);

    // Diagonal gradient fill for all dots
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, cfg.gradientFrom);
    grad.addColorStop(1, cfg.gradientTo);
    ctx.fillStyle = grad;

    const cr = cfg.cursorRadius;
    const crSq = cr * cr;
    const rad = cfg.dotRadius / 2;
    const isBulge = cfg.bulgeOnly;

    ctx.beginPath();

    for (let i = 0; i < len; i++) {
      const dot = dots[i];
      const dx = mouse.x - dot.ax;
      const dy = mouse.y - dot.ay;
      const distSq = dx * dx + dy * dy;

      if (distSq < crSq && eng > 0.01) {
        const dist = Math.sqrt(distSq);
        if (isBulge) {
          const f = 1 - dist / cr;
          const push = f * f * cfg.bulgeStrength * eng;
          const angle = Math.atan2(dy, dx);
          dot.sx += (dot.ax - Math.cos(angle) * push - dot.sx) * 0.15;
          dot.sy += (dot.ay - Math.sin(angle) * push - dot.sy) * 0.15;
        } else {
          const angle = Math.atan2(dy, dx);
          const move = (500 / dist) * (mouse.speed * cfg.cursorForce);
          dot.vx += Math.cos(angle) * -move;
          dot.vy += Math.sin(angle) * -move;
        }
      } else if (isBulge) {
        dot.sx += (dot.ax - dot.sx) * 0.1;
        dot.sy += (dot.ay - dot.sy) * 0.1;
      }

      if (!isBulge) {
        dot.vx *= 0.9;
        dot.vy *= 0.9;
        dot.x = dot.ax + dot.vx;
        dot.y = dot.ay + dot.vy;
        dot.sx += (dot.x - dot.sx) * 0.1;
        dot.sy += (dot.y - dot.sy) * 0.1;
      }

      let drawX = dot.sx;
      let drawY = dot.sy;
      if (cfg.waveAmplitude > 0) {
        drawY += Math.sin(dot.ax * 0.03 + t) * cfg.waveAmplitude;
        drawX += Math.cos(dot.ay * 0.03 + t * 0.7) * cfg.waveAmplitude * 0.5;
      }

      if (cfg.sparkle) {
        const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0;
        if ((hash % 100) < 3) {
          ctx.moveTo(drawX + rad * 1.8, drawY);
          ctx.arc(drawX, drawY, rad * 1.8, 0, TWO_PI);
        } else {
          ctx.moveTo(drawX + rad, drawY);
          ctx.arc(drawX, drawY, rad, 0, TWO_PI);
        }
      } else {
        ctx.moveTo(drawX + rad, drawY);
        ctx.arc(drawX, drawY, rad, 0, TWO_PI);
      }
    }

    ctx.fill();

    if (!revealed) {
      revealed = true;
      requestAnimationFrame(() => {
        canvas.style.opacity = '1';
        svg.style.opacity = '1';
      });
    }
  }

  // ----- Init -----
  doResize();
  const ro = new ResizeObserver(() => onResize());
  ro.observe(el);
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  raf = requestAnimationFrame(tick);

  return { canvas, svg, raf, ro, speedInterval, onMouseMove };
}
