import { useState } from "react";
import * as Yup from "yup";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Stack, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Camera } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import FormProvider, { RHFTextField } from "@/components/hook-form";
import { useCroppedImage } from "@/components/ImageMenu";
import useIsLoading from "@/hooks/useIsLoading";
import { GetOnboarding, SkipSetupStep } from "@/redux/slices/actions/onboardingActions";
import { UpdateProfile } from "@/redux/slices/actions/userActions";
import getAvatar from "@/utils/avatars";
import { dateInputOf } from "@/utils/birthdays";
import { coverStyleOf } from "@/utils/covers";
import { BIO_LIMIT, bioRule } from "@/utils/formRules";

const ProfileSchema = Yup.object({ activityStatus: bioRule });

const ProfileStep = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const isSaving = useIsLoading(UpdateProfile);
  const isSkipping = useIsLoading(SkipSetupStep);
  const [photo, setPhoto] = useState("");
  const { pick, picker } = useCroppedImage("photo", setPhoto);
  const methods = useForm({ mode: "onChange", resolver: yupResolver(ProfileSchema), defaultValues: { activityStatus: "" } });
  const bio = useWatch({ control: methods.control, name: "activityStatus" });

  // the profile is saved whole, so everything but the photo and the bio goes back as it already is
  const save = async ({ activityStatus }) => {
    const { pattern, palette } = coverStyleOf(user);
    const result = await dispatch(
      UpdateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        activityStatus,
        birthday: dateInputOf(user.birthday),
        coverPattern: pattern,
        coverPalette: palette,
        avatar: photo || user.avatar || "",
        cover: user.cover || "",
      })
    );
    if (UpdateProfile.fulfilled.match(result)) dispatch(GetOnboarding());
  };

  return (
    <FormProvider methods={methods} onSubmit={methods.handleSubmit(save)}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography component="h2" sx={{ m: 0, fontSize: 20, fontWeight: 700 }}>
            Your photo and bio
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Help your friends recognise you. Both are optional, and you can change them on your profile any time.
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={2}>
          {getAvatar(photo || user.avatar, `${user.firstName} ${user.lastName}`, 88)}
          <Button variant="outlined" color="inherit" startIcon={<Camera />} onClick={pick}>
            {photo ? "Choose another" : "Choose a photo"}
          </Button>
          {picker}
        </Stack>
        <RHFTextField name="activityStatus" label="Bio" multiline minRows={2} helperText={`Shown in the bubble beside your photo, up to ${BIO_LIMIT} characters.`} />
        <Stack spacing={1}>
          <LoadingButton type="submit" size="large" variant="contained" fullWidth disabled={!photo && !bio.trim()} loading={isSaving}>
            Continue
          </LoadingButton>
          <LoadingButton fullWidth color="inherit" loading={isSkipping} onClick={() => dispatch(SkipSetupStep("profile"))}>
            Skip for now
          </LoadingButton>
        </Stack>
      </Stack>
    </FormProvider>
  );
};

export default ProfileStep;
