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
    `${basePath}index.html`,

  about:
    `${basePath}pages/about.html`,

  sports:
    `${basePath}pages/sports.html`,

  athletes:
    `${basePath}pages/athletes.html`,

  coaches:
    `${basePath}pages/services.html?category=coach`,

  scouts:
    `${basePath}pages/scouts.html`,

  investors:
    `${basePath}pages/investors.html`,

  community:
    `${basePath}pages/community.html`,

  events:
    `${basePath}pages/events.html`,

  opportunities:
    `${basePath}pages/opportunities.html`,

  opportunitiesPage:
    `${basePath}pages/opportunities.html`,

  marketplace:
    `${basePath}pages/marketplace.html`,

  notifications:
    `${basePath}pages/notifications.html`,

  services:
    `${basePath}pages/services.html`,

  volunteer:
    `${basePath}pages/volunteer.html`,

  ambassadors:
    `${basePath}pages/ambassadors.html`,

  partners:
    `${basePath}pages/partners.html`,

  donate:
    `${basePath}pages/donate.html`,


  football:
    `${basePath}pages/athletes.html?sport=football`,

  athletics:
    `${basePath}pages/athletes.html?sport=athletics`,

  basketball:
    `${basePath}pages/athletes.html?sport=basketball`,

  rugby:
    `${basePath}pages/athletes.html?sport=rugby`,

  tennis:
    `${basePath}pages/athletes.html?sport=tennis`,

  combat:
    `${basePath}pages/athletes.html?sport=combat-sports`,


  physiotherapists:
    `${basePath}pages/services.html?category=physiotherapist`,

  sportsTherapists:
    `${basePath}pages/services.html?category=sports-therapist`,

  nutritionists:
    `${basePath}pages/services.html?category=nutritionist`,

  psychologists:
    `${basePath}pages/services.html?category=psychologist`,

  wellbeing:
    `${basePath}pages/services.html?category=wellbeing-specialist`,

  recovery:
    `${basePath}pages/services.html?category=recovery-expert`,

  mentors:
    `${basePath}pages/services.html?category=mentor`,

  performance:
    `${basePath}pages/services.html?category=performance-specialist`,


  login:
    `${basePath}auth/login.html`,

  register:
    `${basePath}auth/register.html`,


  terms:
    `${basePath}legal/terms.html`,

  privacy:
    `${basePath}legal/privacy.html`,

  cookies:
    `${basePath}legal/cookies.html`,

  communityGuidelines:
    `${basePath}legal/community-guidelines.html`,

  safeguarding:
    `${basePath}legal/safeguarding.html`,

  copyright:
    `${basePath}legal/copyright.html`,

  contact:
    `${basePath}legal/contact.html`,


  raiseFunds:
    `${basePath}pages/raise-funds.html`

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