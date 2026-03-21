// -----------------------------------------
// SERVICE HOVER — Directional circle fill on service cards
// -----------------------------------------
// Attributes:
//   [data-service-hover]          — the card element (hover target)
//
// Structure in Webflow:
//   card [data-service-hover]     — position: relative, overflow: hidden
//   ├── service__circle-wrap
//   │   └── service__circle       — the expanding circle (CSS handles scale)
//   └── ... card content ...
//
// CSS required (add to Webflow custom code):
//   .service__circle {
//     position: absolute;
//     border-radius: 50%;
//     pointer-events: none;
//     z-index: 0;
//     aspect-ratio: 1;
//     transform: translate(-50%, -50%) scale(0) rotate(0.001deg);
//     transition: transform 0.7s cubic-bezier(0.625, 0.05, 0, 1);
//   }
//   [data-service-hover]:hover .service__circle {
//     transform: translate(-50%, -50%) scale(1) rotate(0.001deg);
//   }

var listeners = [];

function handleHover(event) {
  var card = event.currentTarget;
  var rect = card.getBoundingClientRect();

  var cardWidth = rect.width;
  var cardHeight = rect.height;
  var cardCenterX = rect.left + cardWidth / 2;

  var mouseX = event.clientX;
  var mouseY = event.clientY;

  // Offset from top-left in percentage
  var offsetXFromLeft = ((mouseX - rect.left) / cardWidth) * 100;
  var offsetYFromTop = ((mouseY - rect.top) / cardHeight) * 100;

  // Offset from center — makes circle wider when entering from edges
  var offsetXFromCenter = Math.abs(((mouseX - cardCenterX) / (cardWidth / 2)) * 50);

  var circle = card.querySelector('.service__circle');
  if (circle) {
    circle.style.left = offsetXFromLeft.toFixed(1) + '%';
    circle.style.top = offsetYFromTop.toFixed(1) + '%';
    circle.style.width = (115 + offsetXFromCenter.toFixed(1) * 2) + '%';
  }
}

export function initServiceHover(scope) {
  scope = scope || document;
  var cards = scope.querySelectorAll('[data-service-hover]');
  if (!cards.length) return;

  cards.forEach(function (card) {
    card.addEventListener('mouseenter', handleHover);
    card.addEventListener('mouseleave', handleHover);
    listeners.push(card);
  });
}

export function destroyServiceHover() {
  listeners.forEach(function (card) {
    card.removeEventListener('mouseenter', handleHover);
    card.removeEventListener('mouseleave', handleHover);
  });
  listeners = [];
}
