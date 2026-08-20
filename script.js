/* ============================================================
   SCRIPT.JS — shared behaviour for every page on the site
   ============================================================
   This one file is linked from all five HTML pages. It does three
   small jobs:
     1. Opens/closes the mobile menu (the ≡ button on small screens)
     2. Highlights the current page in the navigation bar
     3. Fades sections in as you scroll down to them
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // 1) Mobile nav toggle — show/hide the menu when the button is tapped
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('nav.primary');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 2) Mark the current page's link as "active" in the nav bar
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.primary a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });

  // 3) Fade sections in as they scroll into view
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => observer.observe(el));
  } else {
    // Older browsers without IntersectionObserver: just show everything
    revealEls.forEach(el => el.classList.add('in'));
  }
});
