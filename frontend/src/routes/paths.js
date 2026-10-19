function path(root, sublink) {
  return `${root}${sublink}`;
}

const ROOTS_DASHBOARD = "/";

export const PATH_DASHBOARD = {
  root: ROOTS_DASHBOARD,
  general: {
    chat: path(ROOTS_DASHBOARD, "chat"),
    status: path(ROOTS_DASHBOARD, "status"),
    profile: path(ROOTS_DASHBOARD, "settings/profile"),
    contacts: path(ROOTS_DASHBOARD, "contacts"),
    settings: path(ROOTS_DASHBOARD, "settings"),
  },
};

export const PATH_AUTH = {
  root: ROOTS_DASHBOARD,
  general: {
    welcome: path(ROOTS_DASHBOARD, "auth/welcome"),
    login: path(ROOTS_DASHBOARD, "auth/login"),
    register: path(ROOTS_DASHBOARD, "auth/register"),
    verify: path(ROOTS_DASHBOARD, "auth/verify"),
  },
};

export const PATH_SETUP = path(ROOTS_DASHBOARD, "setup");

export const PATH_ADMIN = {
  root: path(ROOTS_DASHBOARD, "admin"),
  overview: path(ROOTS_DASHBOARD, "admin/overview"),
  people: path(ROOTS_DASHBOARD, "admin/people"),
  reports: path(ROOTS_DASHBOARD, "admin/reports"),
  requests: path(ROOTS_DASHBOARD, "admin/requests"),
  audit: path(ROOTS_DASHBOARD, "admin/audit"),
  team: path(ROOTS_DASHBOARD, "admin/team"),
};

export const PATH_DOCS = {
  root: ROOTS_DASHBOARD,
  general: {
    tnc: path(ROOTS_DASHBOARD, "docs/tnc"),
    privacy: path(ROOTS_DASHBOARD, "docs/privacy"),
    deleteAccount: path(ROOTS_DASHBOARD, "docs/delete-account"),
    childSafety: path(ROOTS_DASHBOARD, "docs/child-safety"),
  },
};
