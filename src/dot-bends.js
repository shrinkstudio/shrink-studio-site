// -----------------------------------------
// SHRINK STUDIO — DOT BENDS BACKGROUND
// Two-layer canvas: WebGL2 color bends + Canvas 2D dot field
// -----------------------------------------

// -----------------------------------------
// SHADERS
// -----------------------------------------

const QUAD_VS = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const BENDS_FS = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;
uniform float uFrequency;
uniform float uNoise;
uniform float uBandWidth;
uniform float uRotation;
uniform int uIterations;
uniform float uIntensity;
uniform float uWarp;
uniform float uScale;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform float uParallax;
uniform int uColorCount;
uniform vec3 uColors[8];
uniform float uFadeTop;

in vec2 vUv;
out vec4 fragColor;

// Simplex-like noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                           + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 uv = vUv - 0.5;
  uv.x *= aspect;
  uv /= uScale;

  // Mouse parallax offset
  vec2 mouseOffset = (uMouse - 0.5) * uParallax * uMouseInfluence;
  uv += mouseOffset;

  // Rotation
  float angle = uRotation * 3.14159265 / 180.0;
  float c = cos(angle), s = sin(angle);
  uv = mat2(c, -s, s, c) * uv;

  float t = uTime * uSpeed;

  // Build layered noise field
  float field = 0.0;
  float amp = 1.0;
  vec2 p = uv * uFrequency;

  for (int i = 0; i < 8; i++) {
    if (i >= uIterations) break;
    float n = snoise(p + t * 0.3 * float(i + 1));
    // Warp coordinates for next iteration
    p += vec2(n * uWarp, n * uWarp * 0.7);
    field += n * amp * uNoise;
    amp *= 0.5;
    p *= 1.8;
  }

  // Create banded color pattern
  float bands = field * uBandWidth + uv.x + uv.y * 0.5 + t * 0.1;
  float colorIndex = fract(bands * 0.5 + 0.5) * float(uColorCount);

  // Smooth interpolation between colors
  int idx0 = int(floor(colorIndex));
  int idx1 = int(mod(float(idx0 + 1), float(uColorCount)));
  float blend = fract(colorIndex);
  blend = blend * blend * (3.0 - 2.0 * blend); // smoothstep

  vec3 color = mix(uColors[idx0], uColors[idx1], blend);
  color *= uIntensity;

  // Fade towards top
  float fade = 1.0;
  if (uFadeTop > 0.0) {
    fade = smoothstep(1.0, 1.0 - uFadeTop, vUv.y);
  }

  fragColor = vec4(color, fade);
}`;

// -----------------------------------------
// WebGL helpers
// -----------------------------------------

function compileShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('[DotBends] shader:', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function linkProgram(gl, vsSrc, fsSrc) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.warn('[DotBends] program:', gl.getProgramInfoLog(p));
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

function getUniforms(gl, program, names) {
  const u = {};
  names.forEach(n => { u[n] = gl.getUniformLocation(program, n); });
  return u;
}

function hexToVec3(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return [
    parseInt(hex.slice(0,2), 16) / 255,
    parseInt(hex.slice(2,4), 16) / 255,
    parseInt(hex.slice(4,6), 16) / 255,
  ];
}

function parseColor(str) {
  str = str.trim();
  // rgba(r,g,b,a)
  const rgbaMatch = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/);
  if (rgbaMatch) {
    return {
      r: parseFloat(rgbaMatch[1]) / 255,
      g: parseFloat(rgbaMatch[2]) / 255,
      b: parseFloat(rgbaMatch[3]) / 255,
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
    };
  }
  // hex
  const v = hexToVec3(str);
  return { r: v[0], g: v[1], b: v[2], a: 1 };
}

// -----------------------------------------
// Default colors (rainbow)
// -----------------------------------------

const DEFAULT_COLORS = ['#ff5c7a', '#8a5cff', '#00ffd1', '#ffb347', '#47d1ff', '#ff47ab'];

// -----------------------------------------
// Instance management
// -----------------------------------------

let instances = [];

export function initDotBends(scope = document) {
  const els = scope.querySelectorAll('[data-dot-bends]');
  if (!els.length) return;

  els.forEach(el => {
    try {
      instances.push(createInstance(el));
    } catch (e) {
      console.warn('[DotBends] init failed:', e);
    }
  });
}

export function destroyDotBends() {
  instances.forEach(inst => {
    cancelAnimationFrame(inst.raf);
    inst.ro.disconnect();
    inst.container.removeEventListener('pointermove', inst.onPointer);
    inst.container.removeEventListener('pointerleave', inst.onLeave);
    // WebGL cleanup
    const gl = inst.gl;
    if (gl) {
      gl.deleteProgram(inst.bendsProg);
      gl.deleteBuffer(inst.quadBuf);
    }
    inst.glCanvas.remove();
    inst.dotCanvas.remove();
  });
  instances = [];
}

// -----------------------------------------
// Core setup
// -----------------------------------------

function createInstance(el) {
  const d = el.dataset;

  // Parse colors
  const colorStr = d.dbColors || '';
  const colors = colorStr
    ? colorStr.split(',').map(c => hexToVec3(c.trim()))
    : DEFAULT_COLORS.map(c => hexToVec3(c));
  const colorCount = Math.min(colors.length, 8);

  // Color bends config
  const bends = {
    speed:          parseFloat(d.dbSpeed)          || 0.2,
    frequency:      parseFloat(d.dbFrequency)      || 1,
    noise:          parseFloat(d.dbNoise)           || 0.15,
    bandWidth:      parseFloat(d.dbBandWidth)       || 6,
    rotation:       parseFloat(d.dbRotation)        || 90,
    iterations:     parseInt(d.dbIterations, 10)    || 1,
    intensity:      parseFloat(d.dbIntensity)       || 1.5,
    warp:           parseFloat(d.dbWarp)            || 1,
    scale:          parseFloat(d.dbScale)           || 1,
    mouseInfluence: parseFloat(d.dbMouseInfluence)  || 1,
    parallax:       parseFloat(d.dbParallax)        || 0.5,
  };

  // Dot field config
  const dots = {
    radius:         parseFloat(d.dbDotRadius)       || 1.5,
    spacing:        parseFloat(d.dbDotSpacing)       || 14,
    cursorRadius:   parseFloat(d.dbCursorRadius)     || 500,
    bulgeStrength:  parseFloat(d.dbBulgeStrength)    || 67,
    glowRadius:     parseFloat(d.dbGlowRadius)       || 160,
    from:           parseColor(d.dbDotFrom           || 'rgba(168,85,247,0.35)'),
    to:             parseColor(d.dbDotTo             || 'rgba(180,151,207,0.25)'),
    glowColor:      d.dbGlowColor                    || '#120F17',
  };

  const fadeTop = parseFloat(d.dbFadeTop) || 0;

  // Reduced motion check
  const rmMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = rmMQ.matches;

  // ----- WebGL canvas (bottom layer — color bends) -----
  const glCanvas = document.createElement('canvas');
  glCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;opacity:0;transition:opacity 0.6s ease;';

  // ----- Canvas 2D (top layer — dot field) -----
  const dotCanvas = document.createElement('canvas');
  dotCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;opacity:0;transition:opacity 0.6s ease;';

  el.style.position = 'relative';
  el.style.overflow = 'hidden';
  el.insertBefore(dotCanvas, el.firstChild);
  el.insertBefore(glCanvas, el.firstChild);

  // The container captures pointer events
  const container = el;

  // WebGL2 setup
  const gl = glCanvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: false });
  if (!gl) throw new Error('WebGL2 not supported');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  const bendsProg = linkProgram(gl, QUAD_VS, BENDS_FS);
  if (!bendsProg) throw new Error('Shader compilation failed');

  const bendsU = getUniforms(gl, bendsProg, [
    'uResolution', 'uTime', 'uSpeed', 'uFrequency', 'uNoise', 'uBandWidth',
    'uRotation', 'uIterations', 'uIntensity', 'uWarp', 'uScale',
    'uMouse', 'uMouseInfluence', 'uParallax', 'uColorCount', 'uFadeTop',
  ]);

  // Color uniforms
  const colorLocs = [];
  for (let i = 0; i < 8; i++) {
    colorLocs.push(gl.getUniformLocation(bendsProg, `uColors[${i}]`));
  }

  // Canvas 2D context
  const ctx = dotCanvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Shared mouse state
  const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, speed: 0, engagement: 0 };
  let lastMoveTime = 0;
  let prevMx = -9999, prevMy = -9999;

  const onPointer = (e) => {
    const r = el.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;

    const now = performance.now();
    if (prevMx > -9000) {
      const dt = Math.max(now - lastMoveTime, 1);
      const dx = mouse.x - prevMx;
      const dy = mouse.y - prevMy;
      mouse.speed = Math.sqrt(dx * dx + dy * dy) / dt;
    }
    prevMx = mouse.x;
    prevMy = mouse.y;
    lastMoveTime = now;
  };

  const onLeave = () => {
    mouse.x = -9999;
    mouse.y = -9999;
  };

  container.addEventListener('pointermove', onPointer);
  container.addEventListener('pointerleave', onLeave);

  // Dot grid
  let dotGrid = [];
  let gridW = 0, gridH = 0;

  function buildGrid(w, h) {
    gridW = w;
    gridH = h;
    dotGrid = [];
    const sp = dots.spacing;
    const cols = Math.ceil(w / sp) + 1;
    const rows = Math.ceil(h / sp) + 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        dotGrid.push({
          ax: col * sp,   // anchor x
          ay: row * sp,   // anchor y
          sx: col * sp,   // smooth x
          sy: row * sp,   // smooth y
        });
      }
    }
  }

  // Resize
  function resize() {
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w === 0 || h === 0) return;

    // WebGL canvas
    if (glCanvas.width !== w || glCanvas.height !== h) {
      glCanvas.width = w;
      glCanvas.height = h;
    }

    // Canvas 2D (DPR-aware)
    const cw = Math.round(w * dpr);
    const ch = Math.round(h * dpr);
    if (dotCanvas.width !== cw || dotCanvas.height !== ch) {
      dotCanvas.width = cw;
      dotCanvas.height = ch;
      buildGrid(w, h);
    }
  }

  resize();

  // Bind quad helper
  function bindQuad() {
    const loc = gl.getAttribLocation(bendsProg, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }

  // Animation loop
  const startTime = performance.now();
  let raf = 0;
  let revealed = false;

  function frame() {
    raf = requestAnimationFrame(frame);
    resize();

    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w === 0 || h === 0) return;

    const now = performance.now();
    const t = (now - startTime) / 1000;

    // Smooth mouse (lerp)
    const lerpFactor = 0.08;
    if (mouse.x > -9000) {
      mouse.sx += (mouse.x - mouse.sx) * lerpFactor;
      mouse.sy += (mouse.y - mouse.sy) * lerpFactor;
    }

    // Decay mouse speed / engagement
    const timeSinceMove = now - lastMoveTime;
    if (timeSinceMove > 100) {
      mouse.speed *= 0.92;
    }
    const targetEngagement = Math.min(mouse.speed * 2, 1);
    mouse.engagement += (targetEngagement - mouse.engagement) * 0.05;

    // Skip animation on reduced motion — render once then stop
    if (reducedMotion && revealed) {
      return;
    }

    // ----- Render color bends (WebGL) -----
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(bendsProg);
    bindQuad();

    gl.uniform2f(bendsU.uResolution, w, h);
    gl.uniform1f(bendsU.uTime, t);
    gl.uniform1f(bendsU.uSpeed, bends.speed);
    gl.uniform1f(bendsU.uFrequency, bends.frequency);
    gl.uniform1f(bendsU.uNoise, bends.noise);
    gl.uniform1f(bendsU.uBandWidth, bends.bandWidth);
    gl.uniform1f(bendsU.uRotation, bends.rotation);
    gl.uniform1i(bendsU.uIterations, bends.iterations);
    gl.uniform1f(bendsU.uIntensity, bends.intensity);
    gl.uniform1f(bendsU.uWarp, bends.warp);
    gl.uniform1f(bendsU.uScale, bends.scale);
    gl.uniform1f(bendsU.uMouseInfluence, bends.mouseInfluence);
    gl.uniform1f(bendsU.uParallax, bends.parallax);
    gl.uniform1i(gl.getUniformLocation(bendsProg, 'uColorCount'), colorCount);
    gl.uniform1f(bendsU.uFadeTop, fadeTop);

    // Mouse NDC (0-1)
    const mx = mouse.sx > -9000 ? mouse.sx / w : 0.5;
    const my = mouse.sy > -9000 ? mouse.sy / h : 0.5;
    gl.uniform2f(bendsU.uMouse, mx, my);

    // Set colors
    for (let i = 0; i < 8; i++) {
      if (i < colorCount) {
        gl.uniform3fv(colorLocs[i], colors[i]);
      } else {
        gl.uniform3f(colorLocs[i], 0, 0, 0);
      }
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // ----- Render dot field (Canvas 2D) -----
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cursorActive = mouse.sx > -9000;
    const cr = dots.cursorRadius;
    const cr2 = cr * cr;
    const bulge = dots.bulgeStrength;
    const engagement = mouse.engagement;

    // Update dot positions and draw
    for (let i = 0; i < dotGrid.length; i++) {
      const dot = dotGrid[i];
      let tx = dot.ax;
      let ty = dot.ay;

      if (cursorActive) {
        const dx = dot.ax - mouse.sx;
        const dy = dot.ay - mouse.sy;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < cr2) {
          const dist = Math.sqrt(dist2);
          const force = (1 - dist / cr) * bulge * (0.3 + engagement * 0.7);
          const angle = Math.atan2(dy, dx);
          tx += Math.cos(angle) * force;
          ty += Math.sin(angle) * force;
        }
      }

      // Smooth lerp to target
      dot.sx += (tx - dot.sx) * 0.12;
      dot.sy += (ty - dot.sy) * 0.12;

      // Gradient color based on vertical position
      const vertRatio = dot.ay / h;
      const r = dots.from.r + (dots.to.r - dots.from.r) * vertRatio;
      const g = dots.from.g + (dots.to.g - dots.from.g) * vertRatio;
      const b = dots.from.b + (dots.to.b - dots.from.b) * vertRatio;
      const a = dots.from.a + (dots.to.a - dots.from.a) * vertRatio;

      // Fade top
      let dotAlpha = a;
      if (fadeTop > 0) {
        const fadeRatio = 1 - dot.ay / h; // 1 at top, 0 at bottom
        if (fadeRatio < fadeTop) {
          dotAlpha *= fadeRatio / fadeTop;
        }
      }

      ctx.fillStyle = `rgba(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)},${dotAlpha})`;
      ctx.beginPath();
      ctx.arc(dot.sx, dot.sy, dots.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cursor glow
    if (cursorActive && dots.glowRadius > 0) {
      const glowAlpha = 0.15 + engagement * 0.35;
      const grad = ctx.createRadialGradient(
        mouse.sx, mouse.sy, 0,
        mouse.sx, mouse.sy, dots.glowRadius
      );
      const gc = parseColor(dots.glowColor);
      grad.addColorStop(0, `rgba(${Math.round(gc.r*255)},${Math.round(gc.g*255)},${Math.round(gc.b*255)},${glowAlpha})`);
      grad.addColorStop(1, `rgba(${Math.round(gc.r*255)},${Math.round(gc.g*255)},${Math.round(gc.b*255)},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(mouse.sx - dots.glowRadius, mouse.sy - dots.glowRadius, dots.glowRadius * 2, dots.glowRadius * 2);
    }

    // Fade in after first complete frame
    if (!revealed) {
      revealed = true;
      requestAnimationFrame(() => {
        glCanvas.style.opacity = '1';
        dotCanvas.style.opacity = '1';
      });
    }
  }

  raf = requestAnimationFrame(frame);

  // Resize observer
  const ro = new ResizeObserver(() => resize());
  ro.observe(el);

  return { glCanvas, dotCanvas, gl, bendsProg, quadBuf, raf, ro, onPointer, onLeave, container };
}
