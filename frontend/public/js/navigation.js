const toggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (toggle && navLinks) {

  toggle.addEventListener("click", () => {

    navLinks.classList.toggle("active");

  });

}