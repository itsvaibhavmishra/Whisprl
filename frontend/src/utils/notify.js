import { toast } from "sonner";

const SEVERITIES = ["success", "info", "warning", "error"];

export const notify = ({ severity, message, description }) =>
  (SEVERITIES.includes(severity) ? toast[severity] : toast)(message, { description });

export const errorMessageOf = (error) => error?.error?.message || "Something went wrong, please try again";

export const notifyError = (error) => notify({ severity: "error", message: errorMessageOf(error) });
