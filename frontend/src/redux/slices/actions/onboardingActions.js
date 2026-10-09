import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import axios from "@/utils/axios";

// ------------- Birthday Step -------------
export const SaveBirthdayStep = createApiThunk("onboarding/birthday", async (values) => (await axios.put("/onboarding/birthday", values)).data);

// ------------- Recovery Key Saved -------------
export const ConfirmRecoveryKeySaved = createApiThunk("onboarding/recovery-key", async () => (await axios.put("/onboarding/recovery-key")).data);

// ------------- Refresh Progress -------------
export const GetOnboarding = createApiThunk("onboarding/get", async () => (await axios.get("/onboarding")).data);

// ------------- Skip A Step -------------
export const SkipSetupStep = createApiThunk("onboarding/skip", async (step) => (await axios.put(`/onboarding/${step}/skip`)).data);

// ------------- Username Kept -------------
export const ConfirmUsername = createApiThunk("onboarding/username", async () => (await axios.put("/onboarding/username")).data);

// ------------- What's New Seen -------------
export const MarkWhatsNewSeen = createApiThunk("onboarding/whats-new", async (version) => (await axios.put("/onboarding/whats-new", { version })).data);
