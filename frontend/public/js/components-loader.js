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

  home:
    "/",

  about:
    "/about",

  sports:
    "/sports",

  athletes:
    "/athletes",

  coaches:
    "/services?category=coach",

  scouts:
    "/scouts",

  investors:
    "/investors",

  community:
    "/community",

  events:
    "/events",

  opportunities:
    "/opportunities",

  opportunitiesPage:
    "/opportunities",

  marketplace:
    "/marketplace",

  notifications:
    "/notifications",

  services:
    "/services",

  volunteer:
    "/volunteer",

  ambassadors:
    "/ambassadors",

  partners:
    "/partners",

  donate:
    "/donate",


  football:
    "/athletes?sport=football",

  athletics:
    "/athletes?sport=athletics",

  basketball:
    "/athletes?sport=basketball",

  rugby:
    "/athletes?sport=rugby",

  tennis:
    "/athletes?sport=tennis",

  combat:
    "/athletes?sport=combat-sports",


  physiotherapists:
    "/services?category=physiotherapist",

  sportsTherapists:
    "/services?category=sports-therapist",

  nutritionists:
    "/services?category=nutritionist",

  psychologists:
    "/services?category=psychologist",

  wellbeing:
    "/services?category=wellbeing-specialist",

  recovery:
    "/services?category=recovery-expert",

  mentors:
    "/services?category=mentor",

  performance:
    "/services?category=performance-specialist",


  login:
    "/login",

  register:
    "/register",


  terms:
    "/terms",

  privacy:
    "/privacy",

  cookies:
    "/cookies",

  communityGuidelines:
    "/community-guidelines",

  safeguarding:
    "/safeguarding",

  copyright:
    "/copyright",

  contact:
    "/contact",


  raiseFunds:
    "/raise-funds"

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


    /*
      The header has now been inserted,
      so the hamburger button exists.
    */
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


  /*
    Stop the same button receiving
    the listener more than once.
  */
  if (
    menuToggle.dataset.mobileMenuReady ===
    "true"
  ) {

    return;

  }


  menuToggle.dataset.mobileMenuReady =
    "true";


  menuToggle.setAttribute(
    "aria-expanded",
    "false"
  );


  menuToggle.addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      event.stopPropagation();


      const isOpen =
        navLinks.classList.toggle(
          "active"
        );


      menuToggle.setAttribute(
        "aria-expanded",
        String(
          isOpen
        )
      );


      menuToggle.setAttribute(
        "aria-label",
        isOpen
          ? "Close navigation"
          : "Open navigation"
      );


      menuToggle.textContent =
        isOpen
          ? "✕"
          : "☰";

    }
  );

}


/* =========================
   EXISTING HTML HEADERS
========================= */

/*
  Some older pages still contain
  their header directly in the HTML
  instead of using siteHeader.
*/
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