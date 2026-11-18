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
    review: path(ROOTS_DASHBOARD, "auth/review"),
  },
};

export const PATH_SETUP = path(ROOTS_DASHBOARD, "setup");

export const badgesPathOf = (userId) => path(ROOTS_DASHBOARD, `badges/${userId}`);

export const badgeProgressPathOf = (userId) => `${badgesPathOf(userId)}/progress`;

export const PATH_INVITE = path(ROOTS_DASHBOARD, "invite");

export const PATH_TESTERS = path(ROOTS_DASHBOARD, "testers");

export const PATH_ADMIN = {
  root: path(ROOTS_DASHBOARD, "admin"),
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
