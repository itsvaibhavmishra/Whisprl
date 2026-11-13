import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import axios from "@/utils/axios";
import { notify } from "@/utils/notify";
import { authenticateWithPasskey } from "@/utils/passkeys";

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
