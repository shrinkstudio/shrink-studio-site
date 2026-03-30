// -----------------------------------------
// SHRINK STUDIO — DITHER BACKGROUND
// Vanilla WebGL2 dither wave effect
// Two-pass: waves → framebuffer, dither → screen
// -----------------------------------------

const QUAD_VS = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const WAVE_FS = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uWaveSpeed;
uniform float uWaveFrequency;
uniform float uWaveAmplitude;
uniform vec3 uWaveColor;
uniform vec3 uBgColor;
uniform vec2 uMousePos;
uniform int uEnableMouse;
uniform float uMouseRadius;
out vec4 fragColor;

vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
  Pi = mod289(Pi);
  vec4 ix = Pi.xzxz, iy = Pi.yyww;
  vec4 fx = Pf.xzxz, fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x), g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z), g11 = vec2(gx.w, gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

float fbm(vec2 p) {
  float value = 0.0, amp = 1.0, freq = uWaveFrequency;
  for (int i = 0; i < 4; i++) {
    value += amp * abs(cnoise(p));
    p *= freq;
    amp *= uWaveAmplitude;
  }
  return value;
}

float pattern(vec2 p) {
  return fbm(p + fbm(p - uTime * uWaveSpeed));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution - 0.5;
  uv.x *= uResolution.x / uResolution.y;
  float f = pattern(uv);
  if (uEnableMouse == 1) {
    vec2 mouseNDC = (uMousePos / uResolution - 0.5) * vec2(1.0, -1.0);
    mouseNDC.x *= uResolution.x / uResolution.y;
    float dist = length(uv - mouseNDC);
    f -= 0.5 * (1.0 - smoothstep(0.0, uMouseRadius, dist));
  }
  fragColor = vec4(mix(uBgColor, uWaveColor, f), 1.0);
}`;

const DITHER_FS = `#version 300 es
precision highp float;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uColorNum;
uniform float uPixelSize;
in vec2 vUv;
out vec4 fragColor;

const float bayer[64] = float[64](
  0.0/64.0, 48.0/64.0, 12.0/64.0, 60.0/64.0,  3.0/64.0, 51.0/64.0, 15.0/64.0, 63.0/64.0,
  32.0/64.0,16.0/64.0, 44.0/64.0, 28.0/64.0, 35.0/64.0,19.0/64.0, 47.0/64.0, 31.0/64.0,
  8.0/64.0, 56.0/64.0,  4.0/64.0, 52.0/64.0, 11.0/64.0,59.0/64.0,  7.0/64.0, 55.0/64.0,
  40.0/64.0,24.0/64.0, 36.0/64.0, 20.0/64.0, 43.0/64.0,27.0/64.0, 39.0/64.0, 23.0/64.0,
  2.0/64.0, 50.0/64.0, 14.0/64.0, 62.0/64.0,  1.0/64.0,49.0/64.0, 13.0/64.0, 61.0/64.0,
  34.0/64.0,18.0/64.0, 46.0/64.0, 30.0/64.0, 33.0/64.0,17.0/64.0, 45.0/64.0, 29.0/64.0,
  10.0/64.0,58.0/64.0,  6.0/64.0, 54.0/64.0,  9.0/64.0,57.0/64.0,  5.0/64.0, 53.0/64.0,
  42.0/64.0,26.0/64.0, 38.0/64.0, 22.0/64.0, 41.0/64.0,25.0/64.0, 37.0/64.0, 21.0/64.0
);

vec3 dither(vec2 coord, vec3 color) {
  vec2 sc = floor(coord / uPixelSize);
  int x = int(mod(sc.x, 8.0)), y = int(mod(sc.y, 8.0));
  float threshold = bayer[y * 8 + x] - 0.25;
  float s = 1.0 / (uColorNum - 1.0);
  color += threshold * s;
  color = clamp(color - 0.2, 0.0, 1.0);
  return floor(color * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
}

void main() {
  vec2 npx = uPixelSize / uResolution;
  vec2 uvPx = npx * floor(vUv / npx);
  vec4 color = texture(uTexture, uvPx);
  color.rgb = dither(gl_FragCoord.xy, color.rgb);
  fragColor = color;
}`;

// -----------------------------------------
// WebGL helpers
// -----------------------------------------

function compileShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('[DitherBG] shader:', gl.getShaderInfoLog(s));
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
    console.warn('[DitherBG] program:', gl.getProgramInfoLog(p));
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

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return [
    parseInt(hex.slice(0,2), 16) / 255,
    parseInt(hex.slice(2,4), 16) / 255,
    parseInt(hex.slice(4,6), 16) / 255,
  ];
}

// -----------------------------------------
// Instance management
// -----------------------------------------

let instances = [];

export function initDitherBackground(scope = document) {
  const els = scope.querySelectorAll('[data-dither-background]');
  if (!els.length) return;

  els.forEach(el => {
    try {
      instances.push(createInstance(el));
    } catch (e) {
      console.warn('[DitherBG] init failed:', e);
    }
  });
}

export function destroyDitherBackground() {
  instances.forEach(inst => {
    cancelAnimationFrame(inst.raf);
    inst.ro.disconnect();
    inst.canvas.removeEventListener('pointermove', inst.onPointer);
    const gl = inst.gl;
    gl.deleteProgram(inst.waveProg);
    gl.deleteProgram(inst.ditherProg);
    gl.deleteBuffer(inst.quadBuf);
    gl.deleteTexture(inst.fbTex);
    gl.deleteFramebuffer(inst.fb);
    inst.canvas.remove();
  });
  instances = [];
}

// -----------------------------------------
// Core setup
// -----------------------------------------

function createInstance(el) {
  // Config from data attributes (colours accept hex e.g. #30FFAB)
  const d = el.dataset;
  const cfg = {
    speed:       parseFloat(d.ditherSpeed)       || 0.05,
    frequency:   parseFloat(d.ditherFrequency)   || 3,
    amplitude:   parseFloat(d.ditherAmplitude)    || 0.3,
    color:       hexToRgb(d.ditherColor          || '#808080'),
    bgColor:     hexToRgb(d.ditherBgColor        || '#000000'),
    colorNum:    parseFloat(d.ditherColorNum)     || 4,
    pixelSize:   parseFloat(d.ditherPixelSize)    || 2,
    mouse:       d.ditherMouse !== 'false',
    mouseRadius: parseFloat(d.ditherMouseRadius)  || 1,
  };

  // Canvas
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:auto;';
  el.style.position = 'relative';
  el.insertBefore(canvas, el.firstChild);

  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
  if (!gl) throw new Error('WebGL2 not supported');

  // Fullscreen quad (two triangles)
  const quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  // Programs
  const waveProg = linkProgram(gl, QUAD_VS, WAVE_FS);
  const ditherProg = linkProgram(gl, QUAD_VS, DITHER_FS);
  if (!waveProg || !ditherProg) throw new Error('Shader compilation failed');

  const waveU = getUniforms(gl, waveProg, [
    'uResolution', 'uTime', 'uWaveSpeed', 'uWaveFrequency', 'uWaveAmplitude',
    'uWaveColor', 'uBgColor', 'uMousePos', 'uEnableMouse', 'uMouseRadius'
  ]);
  const ditherU = getUniforms(gl, ditherProg, [
    'uTexture', 'uResolution', 'uColorNum', 'uPixelSize'
  ]);

  // Framebuffer for wave pass
  const fbTex = gl.createTexture();
  const fb = gl.createFramebuffer();
  let fbW = 0, fbH = 0;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w;
    canvas.height = h;
    if (w !== fbW || h !== fbH) {
      fbW = w;
      fbH = h;
      gl.bindTexture(gl.TEXTURE_2D, fbTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTex, 0);
    }
  }

  resize();

  // Mouse tracking
  const mouse = { x: 0, y: 0 };
  const onPointer = (e) => {
    if (!cfg.mouse) return;
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  };
  canvas.addEventListener('pointermove', onPointer);

  // Attribute setup helper
  function bindQuad(program) {
    const loc = gl.getAttribLocation(program, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }

  // Animation loop
  const startTime = performance.now();
  let raf = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    resize();
    const w = canvas.width, h = canvas.height;
    if (w === 0 || h === 0) return;
    const t = (performance.now() - startTime) / 1000;

    // Pass 1: waves → framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, w, h);
    gl.useProgram(waveProg);
    bindQuad(waveProg);
    gl.uniform2f(waveU.uResolution, w, h);
    gl.uniform1f(waveU.uTime, t);
    gl.uniform1f(waveU.uWaveSpeed, cfg.speed);
    gl.uniform1f(waveU.uWaveFrequency, cfg.frequency);
    gl.uniform1f(waveU.uWaveAmplitude, cfg.amplitude);
    gl.uniform3f(waveU.uWaveColor, cfg.color[0], cfg.color[1], cfg.color[2]);
    gl.uniform3f(waveU.uBgColor, cfg.bgColor[0], cfg.bgColor[1], cfg.bgColor[2]);
    gl.uniform2f(waveU.uMousePos, mouse.x, mouse.y);
    gl.uniform1i(waveU.uEnableMouse, cfg.mouse ? 1 : 0);
    gl.uniform1f(waveU.uMouseRadius, cfg.mouseRadius);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Pass 2: dither → screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.useProgram(ditherProg);
    bindQuad(ditherProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbTex);
    gl.uniform1i(ditherU.uTexture, 0);
    gl.uniform2f(ditherU.uResolution, w, h);
    gl.uniform1f(ditherU.uColorNum, cfg.colorNum);
    gl.uniform1f(ditherU.uPixelSize, cfg.pixelSize);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  raf = requestAnimationFrame(frame);

  // Resize observer
  const ro = new ResizeObserver(() => resize());
  ro.observe(el);

  return { canvas, gl, waveProg, ditherProg, quadBuf, fbTex, fb, raf, ro, onPointer };
}
