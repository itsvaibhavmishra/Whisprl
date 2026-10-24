import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import axios from "@/utils/axios";

export const SaveBirthdayStep = createApiThunk("onboarding/birthday", async (values) => (await axios.put("/onboarding/birthday", values)).data);

export const ConfirmRecoveryKeySaved = createApiThunk("onboarding/recovery-key", async () => (await axios.put("/onboarding/recovery-key")).data);

export const AllowNotifications = createApiThunk("onboarding/notifications", async () => (await axios.put("/onboarding/notifications")).data);

export const GetOnboarding = createApiThunk("onboarding/get", async () => (await axios.get("/onboarding")).data, { notifyErrors: false });

export const SkipSetupStep = createApiThunk("onboarding/skip", async (step) => (await axios.put(`/onboarding/${step}/skip`)).data);

export const ConfirmUsername = createApiThunk("onboarding/username", async () => (await axios.put("/onboarding/username")).data);
