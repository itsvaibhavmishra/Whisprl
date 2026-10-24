import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import axios from "@/utils/axios";
import { pushPermission, registerForPush, stopPush } from "@/utils/push";

export const RegisterPushDevice = createApiThunk(
  "push/register",
  async () => {
    if ((await pushPermission()) !== "granted") return;
    await axios.put("/push/device", { token: await registerForPush() });
  },
  { notifyErrors: false }
);

export const ForgetPushDevice = createApiThunk(
  "push/forget",
  async () => {
    await stopPush();
    await axios.delete("/push/device");
  },
  { notifyErrors: false }
);
