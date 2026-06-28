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
  home: `${basePath}index.html`,
  about: `${basePath}pages/about.html`,
  sports: `${basePath}pages/sports.html`,
  athletes: `${basePath}pages/athletes.html`,
  coaches: `${basePath}pages/services.html?category=coach`,
  scouts: `${basePath}pages/scouts.html`,
  investors: `${basePath}pages/investors.html`,
  community: `${basePath}pages/community.html`,
  marketplace: `${basePath}pages/marketplace.html`,
  notifications: `${basePath}pages/notifications.html`,
  services: `${basePath}pages/services.html`,
  volunteer: `${basePath}pages/volunteer.html`,
  ambassadors: `${basePath}pages/ambassadors.html`,
  partners: `${basePath}pages/partners.html`,
  donate: `${basePath}pages/donate.html`,

  football: `${basePath}pages/athletes.html?sport=football`,
  athletics: `${basePath}pages/athletes.html?sport=athletics`,
  basketball: `${basePath}pages/athletes.html?sport=basketball`,
  rugby: `${basePath}pages/athletes.html?sport=rugby`,
  tennis: `${basePath}pages/athletes.html?sport=tennis`,
  combat: `${basePath}pages/athletes.html?sport=combat-sports`,

  physiotherapists: `${basePath}pages/services.html?category=physiotherapist`,
  sportsTherapists: `${basePath}pages/services.html?category=sports-therapist`,
  nutritionists: `${basePath}pages/services.html?category=nutritionist`,
  psychologists: `${basePath}pages/services.html?category=psychologist`,
  wellbeing: `${basePath}pages/services.html?category=wellbeing-specialist`,
  recovery: `${basePath}pages/services.html?category=recovery-expert`,
  mentors: `${basePath}pages/services.html?category=mentor`,
  performance: `${basePath}pages/services.html?category=performance-specialist`,
  login: `${basePath}auth/login.html`,
  register: `${basePath}auth/register.html`,
  terms: `${basePath}legal/terms.html`,
privacy: `${basePath}legal/privacy.html`,
cookies: `${basePath}legal/cookies.html`,
communityGuidelines: `${basePath}legal/community-guidelines.html`,
safeguarding: `${basePath}legal/safeguarding.html`,
copyright: `${basePath}legal/copyright.html`,
contact: `${basePath}legal/contact.html`
};

async function loadComponent(elementId, fileName) {

  const container =
    document.getElementById(elementId);

  if (!container) return;

  const response =
    await fetch(`${basePath}components/${fileName}`);

  const html =
    await response.text();

  container.innerHTML =
    html;

  applyComponentLinks();

  document.dispatchEvent(
    new CustomEvent(`${elementId}Loaded`)
  );

}

function applyComponentLinks() {

  document.querySelectorAll("[data-link]").forEach((item) => {

    const key =
      item.dataset.link;

    if (links[key]) {
      item.href =
        links[key];
    }

  });

  document.querySelectorAll("[data-src='logo']").forEach((img) => {
    img.src =
      `${basePath}assets/images/TalentGoldPlus.png`;
  });

}

loadComponent("siteHeader", "header.html");
loadComponent("siteFooter", "footer.html");