// Full-screen mega menu, copied from www.ljwebmanagement.com assets/site.js
// (the .lj-menu-toggle / .lj-mega-menu parts only).
(function () {
  'use strict';

  function openMegaMenu() {
    var menu = document.getElementById('lj-mega-menu');
    var toggle = document.querySelector('.lj-menu-toggle');
    if (!menu) return;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lj-menu-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    var closeBtn = menu.querySelector('.lj-mega-menu-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeMegaMenu() {
    var menu = document.getElementById('lj-mega-menu');
    var toggle = document.querySelector('.lj-menu-toggle');
    if (!menu || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lj-menu-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('.lj-menu-toggle')) {
      var menu = document.getElementById('lj-mega-menu');
      if (menu && menu.classList.contains('is-open')) {
        closeMegaMenu();
      } else {
        openMegaMenu();
      }
      return;
    }
    if (e.target.closest('.lj-mega-menu-close')) {
      closeMegaMenu();
      return;
    }
    if (e.target.id === 'lj-mega-menu') {
      closeMegaMenu();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMegaMenu();
  });
})();
