document.addEventListener("siteHeaderLoaded", () => {
  initialiseMobileMenu();
});

document.addEventListener("DOMContentLoaded", () => {
  initialiseMobileMenu();
});

function initialiseMobileMenu() {

  const menuToggle =
    document.querySelector(".menu-toggle");

  const navLinks =
    document.querySelector(".nav-links");

  if (!menuToggle || !navLinks) return;

  if (menuToggle.dataset.ready === "true") return;

  menuToggle.dataset.ready = "true";

  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

}