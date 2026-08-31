const isSubFolder =
  window.location.pathname.includes("/pages/") ||
  window.location.pathname.includes("/auth/") ||
  window.location.pathname.includes("/admin/") ||
  window.location.pathname.includes("/legal/");

const basePath =
  isSubFolder
    ? "../"
    : "";

const links = {
  home: "/",
  about: "/about",
  sports: "/sports",
  athletes: "/athletes",
  coaches: "/services?category=coach",
  scouts: "/scouts",
  investors: "/investors",
  community: "/community",
  events: "/events",
  opportunities: "/opportunities",
  opportunitiesPage: "/opportunities",
  marketplace: "/marketplace",
  notifications: "/notifications",
  services: "/services",
  volunteer: "/volunteer",
  ambassadors: "/ambassadors",
  partners: "/partners",
  donate: "/donate",

  football: "/athletes?sport=football",
  athletics: "/athletes?sport=athletics",
  basketball: "/athletes?sport=basketball",
  rugby: "/athletes?sport=rugby",
  tennis: "/athletes?sport=tennis",
  combat: "/athletes?sport=combat-sports",

  physiotherapists: "/services?category=physiotherapist",
  sportsTherapists: "/services?category=sports-therapist",
  nutritionists: "/services?category=nutritionist",
  psychologists: "/services?category=psychologist",
  wellbeing: "/services?category=wellbeing-specialist",
  recovery: "/services?category=recovery-expert",
  mentors: "/services?category=mentor",
  performance: "/services?category=performance-specialist",

  login: "/login",
  register: "/register",

  terms: "/terms",
  privacy: "/privacy",
  cookies: "/cookies",
  communityGuidelines: "/community-guidelines",
  safeguarding: "/safeguarding",
  copyright: "/copyright",
  contact: "/contact",

  raiseFunds: "/raise-funds"
};


/* =========================
   LOAD COMPONENT
========================= */

async function loadComponent(
  elementId,
  fileName
) {
  const container =
    document.getElementById(
      elementId
    );

  if (!container) {
    return;
  }

  try {
    const response =
      await fetch(
        `${basePath}components/${fileName}`
      );

    if (!response.ok) {
      throw new Error(
        `Unable to load ${fileName}`
      );
    }

    const html =
      await response.text();

    container.innerHTML =
      html;

    applyComponentLinks();

    if (
      elementId ===
      "siteHeader"
    ) {
      initialiseMobileNavigation();
    }

    document.dispatchEvent(
      new CustomEvent(
        `${elementId}Loaded`
      )
    );
  } catch (error) {
    console.error(
      "Component loading error:",
      error
    );
  }
}


/* =========================
   COMPONENT LINKS
========================= */

function applyComponentLinks() {
  document
    .querySelectorAll(
      "[data-link]"
    )
    .forEach(
      (item) => {
        const key =
          item.dataset.link;

        if (
          links[key]
        ) {
          item.href =
            links[key];
        }
      }
    );

  document
    .querySelectorAll(
      "[data-src='logo']"
    )
    .forEach(
      (img) => {
        img.src =
          `${basePath}assets/images/TalentGoldPlus.png`;
      }
    );
}


/* =========================
   MOBILE NAVIGATION
========================= */

function initialiseMobileNavigation() {
  const menuToggle =
    document.querySelector(
      ".menu-toggle"
    );

  const navLinks =
    document.querySelector(
      ".nav-links"
    );

  if (
    !menuToggle ||
    !navLinks
  ) {
    return;
  }

  if (
    menuToggle.dataset.mobileMenuReady ===
    "true"
  ) {
    return;
  }

  menuToggle.dataset.mobileMenuReady =
    "true";

  let overlay =
    document.querySelector(
      ".public-nav-overlay"
    );

  if (!overlay) {
    overlay =
      document.createElement(
        "div"
      );

    overlay.className =
      "public-nav-overlay";

    document.body.appendChild(
      overlay
    );
  }

  function closeDropdowns() {
    navLinks
      .querySelectorAll(
        ".dropdown"
      )
      .forEach(
        (dropdown) => {
          dropdown.classList.remove(
            "mobile-open"
          );
        }
      );
  }

  function openMenu() {
    navLinks.classList.add(
      "mobile-open"
    );

    overlay.classList.add(
      "active"
    );

    menuToggle.classList.add(
      "active"
    );

    menuToggle.textContent =
      "✕";

    menuToggle.setAttribute(
      "aria-expanded",
      "true"
    );

    menuToggle.setAttribute(
      "aria-label",
      "Close navigation"
    );

    document.body.classList.add(
      "public-menu-open"
    );
  }

  function closeMenu() {
    navLinks.classList.remove(
      "mobile-open"
    );

    overlay.classList.remove(
      "active"
    );

    menuToggle.classList.remove(
      "active"
    );

    menuToggle.textContent =
      "☰";

    menuToggle.setAttribute(
      "aria-expanded",
      "false"
    );

    menuToggle.setAttribute(
      "aria-label",
      "Open navigation"
    );

    document.body.classList.remove(
      "public-menu-open"
    );

    closeDropdowns();
  }

  menuToggle.setAttribute(
    "aria-expanded",
    "false"
  );

  menuToggle.setAttribute(
    "aria-label",
    "Open navigation"
  );

  menuToggle.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (
        navLinks.classList.contains(
          "mobile-open"
        )
      ) {
        closeMenu();
      } else {
        openMenu();
      }
    }
  );

  overlay.addEventListener(
    "click",
    closeMenu
  );

  const dropdowns =
    navLinks.querySelectorAll(
      ".dropdown"
    );

  dropdowns.forEach(
    (dropdown) => {
      const dropdownLink =
        dropdown.querySelector(
          "a"
        );

      if (!dropdownLink) {
        return;
      }

      dropdownLink.addEventListener(
        "click",
        (event) => {
          if (
            window.innerWidth >
            950
          ) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          const isOpen =
            dropdown.classList.contains(
              "mobile-open"
            );

          closeDropdowns();

          if (!isOpen) {
            dropdown.classList.add(
              "mobile-open"
            );
          }
        }
      );
    }
  );

  const allLinks =
    navLinks.querySelectorAll(
      "a"
    );

  allLinks.forEach(
    (link) => {
      link.addEventListener(
        "click",
        () => {
          if (
            window.innerWidth >
            950
          ) {
            return;
          }

          const parent =
            link.parentElement;

          if (
            parent &&
            parent.classList.contains(
              "dropdown"
            )
          ) {
            return;
          }

          closeMenu();
        }
      );
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key ===
        "Escape"
      ) {
        closeMenu();
      }
    }
  );

  window.addEventListener(
    "resize",
    () => {
      if (
        window.innerWidth >
        950
      ) {
        closeMenu();
      }
    }
  );
}


/* =========================
   EXISTING HTML HEADERS
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    initialiseMobileNavigation();
  }
);


/* =========================
   START COMPONENTS
========================= */

loadComponent(
  "siteHeader",
  "header.html"
);

loadComponent(
  "siteFooter",
  "footer.html"
);