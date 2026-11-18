import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import axios from "@/utils/axios";
import { fileFromBlobUrl } from "@/utils/blobFile";

export const SaveBirthdayStep = createApiThunk("onboarding/birthday", async (values) => (await axios.put("/onboarding/birthday", values)).data);

export const SaveProfileStep = createApiThunk("onboarding/profile", async ({ name, username, gender, preset, photo }) => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("username", username);
  formData.append("gender", gender);
  if (preset) formData.append("preset", preset);
  if (photo) formData.append("photo", await fileFromBlobUrl(photo, "photo.jpg"));
  const { data } = await axios.put("/onboarding/profile", formData);
  if (photo) URL.revokeObjectURL(photo);
  return data;
});

export const ConfirmRecoveryKeySaved = createApiThunk("onboarding/recovery-key", async () => (await axios.put("/onboarding/recovery-key")).data);

export const GetOnboarding = createApiThunk("onboarding/get", async () => (await axios.get("/onboarding")).data, { notifyErrors: false });
