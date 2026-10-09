function path(root, sublink) {
  return `${root}${sublink}`;
}

const ROOTS_DASHBOARD = "/";

export const PATH_DASHBOARD = {
  root: ROOTS_DASHBOARD,
  general: {
    chat: path(ROOTS_DASHBOARD, "chat"),
    status: path(ROOTS_DASHBOARD, "status"),
    profile: path(ROOTS_DASHBOARD, "profile"),
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

export const PATH_DOCS = {
  root: ROOTS_DASHBOARD,
  general: {
    tnc: path(ROOTS_DASHBOARD, "docs/tnc"),
  },
};
