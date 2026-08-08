const currentPath =
  window.location.pathname;

export const isPageFolder =
  currentPath.includes("/pages/");

export const isAuthFolder =
  currentPath.includes("/auth/");

export const isAuthPage =
  isAuthFolder;

export const loginPath =
  isAuthFolder
    ? "login.html"
    : isPageFolder
      ? "../auth/login.html"
      : "auth/login.html";

export const dashboardPath =
  isPageFolder
    ? "dashboard.html"
    : isAuthFolder
      ? "../pages/dashboard.html"
      : "pages/dashboard.html";

export const homePath =
  isPageFolder || isAuthFolder
    ? "../index.html"
    : "index.html";

export const profileSetupPath =
  isPageFolder
    ? "profile-setup.html"
    : "pages/profile-setup.html";

export const messagesPath =
  isPageFolder
    ? "messages.html"
    : "pages/messages.html";

export const notificationsPath =
  isPageFolder
    ? "notifications.html"
    : "pages/notifications.html";