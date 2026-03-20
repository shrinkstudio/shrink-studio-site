// -----------------------------------------
// SERVICE HOVER — Directional blob fill on service cards
// -----------------------------------------
// Attributes:
//   [data-service-hover]          — the card element (hover target)
//   [data-service-color]          — fill colour from CMS (e.g. "#A8E6CF")
//
// The script injects an SVG blob behind the card content on hover,
// animating in from the direction the mouse enters and out in the
// direction it leaves. Each card gets a different organic blob shape.

var listeners = [];
var blobs = [];

// Organic blob paths — viewBox 0 0 100 100, all different shapes
var blobPaths = [
  'M45.2,-58.3C57.1,-49.8,64.2,-34.1,68.4,-17.5C72.6,-0.9,73.8,16.6,66.8,30.3C59.7,44,44.3,53.9,28.4,60.1C12.5,66.3,-3.9,68.8,-20.8,65.5C-37.7,62.2,-55.1,53.1,-63.4,39.1C-71.7,25.1,-70.9,6.2,-66.2,-10.3C-61.5,-26.8,-52.9,-41,-41,-51.2C-29.1,-61.4,-14.6,-67.6,1.4,-69.3C17.3,-71,33.3,-66.8,45.2,-58.3Z',
  'M39.5,-51.8C50.9,-42.7,59.6,-30.5,63.7,-16.6C67.8,-2.7,67.3,12.9,61.1,26C54.9,39.1,43,49.7,29.3,56.3C15.6,62.9,0.1,65.5,-16.2,63.1C-32.5,60.7,-49.6,53.3,-58.8,40.5C-68,27.7,-69.3,9.5,-65.9,-6.8C-62.5,-23.1,-54.4,-37.5,-43.1,-46.7C-31.8,-55.9,-15.9,-59.9,-0.6,-59.2C14.7,-58.4,28.1,-60.9,39.5,-51.8Z',
  'M42.8,-55.6C54.6,-46.9,62.8,-33.3,67.2,-18.3C71.6,-3.3,72.2,13.1,65.6,26.1C59,39.1,45.2,48.7,30.7,55.6C16.2,62.5,1,66.7,-14.9,64.8C-30.8,62.9,-47.4,54.9,-57.3,42.1C-67.2,29.3,-70.4,11.7,-67.5,-4.1C-64.6,-19.9,-55.6,-33.9,-43.8,-42.7C-32,-51.5,-16,-55.1,0.1,-55.2C16.2,-55.4,31,-64.3,42.8,-55.6Z',
  'M37.9,-49.7C49.5,-40.8,59.4,-29.6,64.1,-16C68.8,-2.4,68.3,13.6,61.4,26.3C54.5,39,41.2,48.4,27,54.8C12.8,61.2,-2.3,64.6,-17.8,62.1C-33.3,59.6,-49.2,51.2,-58.1,38.3C-67,25.4,-68.9,8,-64.9,-7.1C-60.9,-22.2,-51,-35,-39.4,-44C-27.8,-53,-13.9,-58.2,0.5,-58.8C14.9,-59.5,26.3,-58.6,37.9,-49.7Z'
];

function getDirection(el, event) {
  var rect = el.getBoundingClientRect();
  var x = event.clientX - rect.left - rect.width / 2;
  var y = event.clientY - rect.top - rect.height / 2;

  // Use atan2 to determine edge: 0=top, 1=right, 2=bottom, 3=left
  var angle = Math.atan2(y, x) * (180 / Math.PI) + 180;
  // Rotate so 0 degrees is top-center
  var dir = Math.round((angle + 45) % 360 / 90) % 4;
  return dir; // 0=left, 1=top, 2=right, 3=bottom
}

function getOffset(direction) {
  // Returns x/y percentage offset for enter/leave direction
  switch (direction) {
    case 0: return { x: -110, y: 0 };   // left
    case 1: return { x: 0, y: -110 };   // top
    case 2: return { x: 110, y: 0 };    // right
    case 3: return { x: 0, y: 110 };    // bottom
    default: return { x: 0, y: 110 };
  }
}

function ensureBlob(card, index) {
  var blob = card.querySelector('.service-hover__blob');
  if (blob) return blob;

  // Read colour from attribute, or from a hidden text element bound to CMS
  var colorEl = card.querySelector('[data-service-color]');
  var color = (colorEl ? colorEl.textContent.trim() : card.getAttribute('data-service-color')) || '#A8E6CF';
  var pathIndex = index % blobPaths.length;

  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '-100 -100 200 200');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('class', 'service-hover__blob');
  svg.style.cssText = 'position:absolute;inset:-20%;width:140%;height:140%;pointer-events:none;z-index:0;';

  var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', blobPaths[pathIndex]);
  path.setAttribute('fill', color);
  path.setAttribute('transform', 'translate(0,0)');
  svg.appendChild(path);

  // Ensure card has relative positioning for the absolute blob
  if (getComputedStyle(card).position === 'static') {
    card.style.position = 'relative';
  }
  card.style.overflow = 'hidden';
  card.insertBefore(svg, card.firstChild);
  blobs.push(svg);

  // Elevate all sibling content above the blob
  for (var i = 0; i < card.children.length; i++) {
    var child = card.children[i];
    if (child !== svg) {
      child.style.position = 'relative';
      child.style.zIndex = '1';
    }
  }

  return svg;
}

function handleEnter(event) {
  var card = event.currentTarget;
  var index = parseInt(card.getAttribute('data-service-hover'), 10) || 0;
  var blob = ensureBlob(card, index);
  var dir = getDirection(card, event);
  var offset = getOffset(dir);

  gsap.killTweensOf(blob);
  gsap.set(blob, { xPercent: offset.x, yPercent: offset.y });
  gsap.to(blob, {
    xPercent: 0,
    yPercent: 0,
    duration: 0.5,
    ease: 'power2.out',
  });
}

function handleLeave(event) {
  var card = event.currentTarget;
  var blob = card.querySelector('.service-hover__blob');
  if (!blob) return;

  var dir = getDirection(card, event);
  var offset = getOffset(dir);

  gsap.killTweensOf(blob);
  gsap.to(blob, {
    xPercent: offset.x,
    yPercent: offset.y,
    duration: 0.4,
    ease: 'power2.in',
  });
}

export function initServiceHover(scope) {
  scope = scope || document;
  var cards = scope.querySelectorAll('[data-service-hover]');
  if (!cards.length) return;

  cards.forEach(function (card, i) {
    // Store index for blob shape variation if not already set
    if (!card.getAttribute('data-service-hover') || card.getAttribute('data-service-hover') === '') {
      card.setAttribute('data-service-hover', i);
    }
    card.addEventListener('mouseenter', handleEnter);
    card.addEventListener('mouseleave', handleLeave);
    listeners.push(card);
  });
}

export function destroyServiceHover() {
  listeners.forEach(function (card) {
    card.removeEventListener('mouseenter', handleEnter);
    card.removeEventListener('mouseleave', handleLeave);
  });
  listeners = [];

  blobs.forEach(function (blob) {
    if (blob.parentNode) blob.parentNode.removeChild(blob);
  });
  blobs = [];
}
