function path(root, sublink) {
  return `${root}${sublink}`;
}

const ROOTS_DASHBOARD = "/";

export const PATH_DASHBOARD = {
  root: ROOTS_DASHBOARD,
  general: {
    app: path(ROOTS_DASHBOARD, "app"),
  },
};

export const PATH_AUTH = {
  root: ROOTS_DASHBOARD,
  general: {
    welcome: path(ROOTS_DASHBOARD, "auth/welcome"),
    login: path(ROOTS_DASHBOARD, "auth/login"),
    register: path(ROOTS_DASHBOARD, "auth/register"),
  },
};

export const PATH_DOCS = {
  root: ROOTS_DASHBOARD,
  general: {
    tnc: path(ROOTS_DASHBOARD, "docs/tnc"),
  },
};
