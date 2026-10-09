import { toast } from "sonner";

const SEVERITIES = ["success", "info", "warning", "error"];

export const notify = ({ severity, message, description, action, duration }) =>
  message && (SEVERITIES.includes(severity) ? toast[severity] : toast)(message, { description, action, duration });

// a logout is announced once by itself, so the requests it stopped add nothing
export const errorMessageOf = (error) =>
  error?.isLoggedOut ? null : error?.error?.message || "Something went wrong, please try again";

export const notifyError = (error) => notify({ severity: "error", message: errorMessageOf(error) });
