import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import axios from "@/utils/axios";
import { notify } from "@/utils/notify";
import { authenticateWithPasskey } from "@/utils/passkeys";

export const GetPeople = createApiThunk(
  "admin/people",
  async ({ search, filter, page }) => (await axios.get("/admin/people", { params: { search, filter, page } })).data,
  { notifyErrors: false }
);

// the passkey is asked for as the action is taken, so holding the session alone is never enough
export const confirmWithPasskey = async () => {
  const { data } = await axios.post("/admin/confirm");
  const { response } = await authenticateWithPasskey(data.options);
  return response;
};

const withPasskey = (type, send, done) =>
  createApiThunk(type, async (args) => {
    const { data } = await send(args, await confirmWithPasskey());
    notify({ severity: "success", message: done });
    return data;
  });

const actOnPerson = (path, done) =>
  withPasskey(`admin/${path}`, ({ userId, ...details }, confirmation) => axios.put(`/admin/people/${userId}/${path}`, { ...details, confirmation }), done);

export const SuspendPerson = actOnPerson("suspend", "Suspended, and their sessions are closed");
export const BanPerson = actOnPerson("ban", "Banned, and their sessions are closed");
export const RestorePerson = actOnPerson("restore", "Their access is back");

export const GetReports = createApiThunk("admin/reports", async ({ filter, page }) => (await axios.get("/admin/reports", { params: { filter, page } })).data, {
  notifyErrors: false,
});

export const DismissReport = createApiThunk("admin/dismiss", async ({ reportId, reason }) => {
  const { data } = await axios.put(`/admin/reports/${reportId}/dismiss`, { reason });
  notify({ severity: "success", message: "Dismissed" });
  return data;
});

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

export const GetAppUpdates = createApiThunk("admin/appUpdates", async () => (await axios.get("/app/update-policy")).data.policy, { notifyErrors: false });

export const ChangeAppUpdates = withPasskey(
  "admin/appUpdates/change",
  (details, confirmation) => axios.put("/admin/app-updates", { ...details, confirmation }),
  "Saved. Apps pick it up the next time they open"
);

export const GetAnnouncements = createApiThunk(
  "admin/announcements",
  async (before) => (await axios.get("/admin/announcements", { params: { before } })).data,
  { notifyErrors: false }
);

export const GetAudienceSizes = createApiThunk("admin/audienceSizes", async () => (await axios.get("/admin/announcements/audience")).data.sizes, {
  notifyErrors: false,
});

export const GetAnnouncedGames = createApiThunk("admin/announcedGames", async () => (await axios.get("/admin/announcements/games")).data.games, {
  notifyErrors: false,
});

export const SendAnnouncement = createApiThunk("admin/announce", async (announcement) => {
  const { data } = await axios.post("/admin/announcements", announcement);
  notify({ severity: "success", message: "Sending. Whisprl is delivering it now" });
  return data.announcement;
});
