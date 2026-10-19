import * as Sentry from "@sentry/node";

import packageJson from "#package.json" with { type: "json" };

// set only on the production server, so errors met while developing stay in the terminal
const dsn = process.env.SENTRY_DSN;

// a request's body, headers and query can hold an email, a password or a token, and a report needs only the route
const scrubbed = (event) => {
  if (event.request) event.request = { method: event.request.method, url: event.request.url?.split("?")[0] };
  delete event.extra;
  return event;
};

// the server's own crash handlers report and then exit, so Sentry's would only report every crash twice
const OWN_HANDLERS = ["OnUncaughtException", "OnUnhandledRejection"];

export const startErrorReports = () => {
  if (!dsn) return;
  Sentry.init({
    dsn,
    release: `whisprl@${packageJson.version}`,
    environment: "production",
    sendDefaultPii: false,
    integrations: (defaults) => defaults.filter((integration) => !OWN_HANDLERS.includes(integration.name)),
    beforeSend: scrubbed,
  });
};

export const reportError = (error, user_id) =>
  Sentry.withScope((scope) => {
    if (user_id) scope.setUser({ id: String(user_id) });
    Sentry.captureException(error);
  });

// a crash exits the process at once, so its report gets a moment to leave first
export const flushErrorReports = () => Sentry.flush(2000);
