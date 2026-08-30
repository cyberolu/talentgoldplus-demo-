const currentPath =
  window.location.pathname;

export const isPageFolder =
  currentPath.includes("/pages/");

export const isAuthFolder =
  currentPath.includes("/auth/");

export const isAuthPage =
  currentPath === "/login" ||
  currentPath === "/register";

export const loginPath =
  "/login";

export const dashboardPath =
  "/dashboard";

export const homePath =
  "/";

export const profileSetupPath =
  "/profile-setup";

export const messagesPath =
  "/messages";

export const notificationsPath =
  "/notifications";