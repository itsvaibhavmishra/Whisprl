import * as Sentry from "@sentry/capacitor";
import * as SentryReact from "@sentry/react";

import { canReloadForNewVersion, isMissingCode } from "@/utils/newVersion";
import { isApp } from "@/utils/platform";

// set only in builds people use, so errors met while developing stay in the console and never count against the month
const DSN = import.meta.env.REACT_APP_SENTRY_DSN;

// a parse error quotes the text it failed on in double quotes, and that text may be a decrypted message
const withoutQuotes = (text) => (typeof text === "string" ? text.replace(/"[^"\n]*"/g, '"…"') : text);

// a search or a link can carry a name in its query, and the path is all a report needs
const withoutQuery = (url) => (typeof url === "string" ? url.split("?")[0] : url);

const isMissingCodeEvent = (event) => Boolean(event.exception?.values?.some((exception) => isMissingCode(exception.type, exception.value)));

const scrubbed = (event) => {
  // code missing after a deploy is fixed by the reload that follows, and offline it is the connection, so neither is a bug
  if (isMissingCodeEvent(event) && (!navigator.onLine || canReloadForNewVersion())) return null;
  event.exception?.values?.forEach((exception) => {
    exception.value = withoutQuotes(exception.value);
  });
  if (event.message) event.message = withoutQuotes(event.message);
  if (event.request) event.request = { url: withoutQuery(event.request.url), headers: { "User-Agent": event.request.headers?.["User-Agent"] } };
  delete event.extra;
  return event;
};

const scrubbedBreadcrumb = (breadcrumb) => {
  if (breadcrumb.data?.url) breadcrumb.data.url = withoutQuery(breadcrumb.data.url);
  if (breadcrumb.data?.to) breadcrumb.data.to = withoutQuery(breadcrumb.data.to);
  if (breadcrumb.data?.from) breadcrumb.data.from = withoutQuery(breadcrumb.data.from);
  return breadcrumb;
};

// no session replay, no console output and no clicks: any of them could carry what is on screen, which is decrypted
export const startErrorReports = () => {
  if (!DSN) return;
  Sentry.init(
    {
      dsn: DSN,
      release: `whisprl@${import.meta.env.REACT_APP_VERSION}`,
      environment: "production",
      sendDefaultPii: false,
      integrations: [SentryReact.breadcrumbsIntegration({ console: false, dom: false })],
      initialScope: { tags: { platform: isApp ? "android" : "web" } },
      beforeSend: scrubbed,
      beforeBreadcrumb: scrubbedBreadcrumb,
    },
    SentryReact.init
  );
};

// the account id alone, so a report can be matched to a person in the admin panel without naming them
export const reportErrorsAs = (userId) => Sentry.setUser(userId ? { id: userId } : null);

export const ErrorBoundary = SentryReact.ErrorBoundary;
