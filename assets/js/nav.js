(function () {
  var toggle = document.querySelector(".menu-toggle");
  var closeBtn = document.querySelector(".mobile-menu-close");
  var menu = document.getElementById("mobile-menu");
  if (!toggle || !menu) return;

  function openMenu() {
    menu.classList.add("is-open");
    document.body.style.overflow = "hidden";
    toggle.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    menu.classList.remove("is-open");
    document.body.style.overflow = "";
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu.classList.contains("is-open")) closeMenu();
  });

  Array.prototype.forEach.call(menu.querySelectorAll("a"), function (a) {
    a.addEventListener("click", closeMenu);
  });
})();
