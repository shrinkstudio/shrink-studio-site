// -----------------------------------------
// NAV THEME — Section-based nav colour switching
// Sets data-nav-theme on nav based on which section is at the top
// -----------------------------------------

let triggers = [];

export function initNavTheme(scope) {
  scope = scope || document;

  const nav = document.querySelector('[data-menu-wrap]');
  if (!nav) return;
  if (typeof ScrollTrigger === 'undefined') return;

  const sections = scope.querySelectorAll('[data-section-theme]');
  if (!sections.length) return;

  sections.forEach((section) => {
    const theme = section.getAttribute('data-section-theme');

    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top+=1',
      end: 'bottom top+=1',
      onEnter: () => nav.setAttribute('data-nav-theme', theme === 'dark' ? 'light' : 'dark'),
      onEnterBack: () => nav.setAttribute('data-nav-theme', theme === 'dark' ? 'light' : 'dark'),
    });

    triggers.push(st);
  });
}

export function destroyNavTheme() {
  triggers.forEach((st) => st.kill());
  triggers = [];
}
