import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import axios from "@/utils/axios";
import { notify } from "@/utils/notify";
import { authenticateWithPasskey } from "@/utils/passkeys";

// ------------- Overview Thunk -------------
export const GetOverview = createApiThunk("admin/overview", async ({ from, to }) => (await axios.get("/admin/overview", { params: { from, to } })).data, { notifyErrors: false });

export const GetActivePeople = createApiThunk("admin/active", async ({ from, to, page }) => (await axios.get("/admin/active", { params: { from, to, page } })).data, { notifyErrors: false });

// ------------- People Thunk -------------
export const GetPeople = createApiThunk("admin/people", async ({ search, filter, page }) => (await axios.get("/admin/people", { params: { search, filter, page } })).data, { notifyErrors: false });

// ------------- Moderation Thunks -------------
// the passkey is asked for as the action is taken, so holding the session alone is never enough
const confirmed = async () => {
  const { data } = await axios.post("/admin/confirm");
  const { response } = await authenticateWithPasskey(data.options);
  return response;
};

const withPasskey = (type, send, done) =>
  createApiThunk(type, async (args) => {
    const { data } = await send(args, await confirmed());
    notify({ severity: "success", message: done });
    return data;
  });

const actOnPerson = (path, done) =>
  withPasskey(`admin/${path}`, ({ userId, ...details }, confirmation) => axios.put(`/admin/people/${userId}/${path}`, { ...details, confirmation }), done);

export const SuspendPerson = actOnPerson("suspend", "Suspended, and their sessions are closed");
export const BanPerson = actOnPerson("ban", "Banned, and their sessions are closed");
export const RestorePerson = actOnPerson("restore", "Their access is back");

// ------------- Reports Thunks -------------
export const GetReports = createApiThunk("admin/reports", async ({ filter, page }) => (await axios.get("/admin/reports", { params: { filter, page } })).data, { notifyErrors: false });

export const DismissReport = createApiThunk("admin/dismiss", async ({ reportId, reason }) => {
  const { data } = await axios.put(`/admin/reports/${reportId}/dismiss`, { reason });
  notify({ severity: "success", message: "Dismissed" });
  return data;
});

// ------------- Game Request Thunks -------------
export const GetGameRequests = createApiThunk(
  "admin/gameRequests",
  async ({ status, kind, search, page }) => (await axios.get("/admin/game-requests", { params: { status, kind, search, page } })).data
);

export const CloseGameRequests = createApiThunk("admin/closeGameRequests", async ({ key, outcome }) => {
  const { data } = await axios.put(`/admin/game-requests/${encodeURIComponent(key)}/close`, { outcome });
  notify({ severity: "success", message: outcome === "added" ? "Marked as added" : "Dismissed" });
  return data;
});

// ------------- Team Thunks -------------
export const GetTeam = createApiThunk("admin/team", async () => (await axios.get("/admin/team")).data, { notifyErrors: false });

export const AddAdmin = withPasskey("admin/team/add", (details, confirmation) => axios.post("/admin/team", { ...details, confirmation }), "Added to the team");

export const ChangeAccess = withPasskey(
  "admin/team/change",
  ({ userId, ...details }, confirmation) => axios.put(`/admin/team/${userId}`, { ...details, confirmation }),
  "Their access is updated"
);

export const RemoveAdmin = withPasskey(
  "admin/team/remove",
  ({ userId, ...details }, confirmation) => axios.put(`/admin/team/${userId}/remove`, { ...details, confirmation }),
  "Removed from the team"
);

// ------------- Audit Log Thunk -------------
export const GetAuditLog = createApiThunk("admin/audit", async (before) => (await axios.get("/admin/audit", { params: { before } })).data, { notifyErrors: false });
