import { useEffect } from "react";
import * as Yup from "yup";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Box, Button, Paper, Slide, Stack, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useDispatch, useSelector } from "react-redux";

import FormProvider, { RHFTextField } from "@/components/hook-form";
import ProfileHero from "@/components/ProfileHero";
import { UpdateProfile } from "@/redux/slices/actions/userActions";
import AccountSummary from "@/sections/profile/AccountSummary";
import ImageMenu from "@/sections/profile/ImageMenu";
import { nameRule } from "@/utils/formRules";

const STATUS_LIMIT = 50;

const ProfileSchema = Yup.object({
  firstName: nameRule("First name"),
  lastName: nameRule("Last name"),
  activityStatus: Yup.string()
    .trim()
    .required("Status required")
    .min(3, "Status must be at least 3 characters long")
    .max(STATUS_LIMIT, `Status cannot be more than ${STATUS_LIMIT} characters`),
  avatar: Yup.string(),
  cover: Yup.string(),
});

const toFormValues = ({ firstName, lastName, activityStatus, avatar, cover }) => ({
  firstName: firstName || "",
  lastName: lastName || "",
  activityStatus: activityStatus || "",
  avatar: avatar || "",
  cover: cover || "",
});

const SectionTitle = ({ id, children }) => (
  <Typography id={id} component="h2" sx={{ m: 0, mb: 2.5, fontSize: 18, fontWeight: 700 }}>
    {children}
  </Typography>
);

const SaveBar = ({ visible, saving, onDiscard }) => (
  <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
    <Paper
      elevation={0}
      role="region"
      aria-label="Unsaved changes"
      sx={{
        position: "sticky",
        bottom: { xs: 12, md: 24 },
        mt: 4,
        px: { xs: 2, md: 3 },
        py: 1.5,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        borderRadius: 3,
        border: 1,
        borderColor: "divider",
        boxShadow: (theme) => theme.customShadows?.z24,
      }}
    >
      <Typography sx={{ fontWeight: 600 }}>You have unsaved changes</Typography>
      <Stack direction="row" spacing={1}>
        <Button color="inherit" disabled={saving} onClick={onDiscard}>
          Discard
        </Button>
        <LoadingButton type="submit" variant="contained" loading={saving}>
          Save changes
        </LoadingButton>
      </Stack>
    </Paper>
  </Slide>
);

const ProfileEditor = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);

  const methods = useForm({
    mode: "onChange",
    resolver: yupResolver(ProfileSchema),
    defaultValues: toFormValues(user),
  });
  const {
    control,
    reset,
    setValue,
    handleSubmit,
    formState: { isDirty, isSubmitting },
  } = methods;
  const live = useWatch({ control });

  useEffect(() => {
    if (!isDirty) reset(toFormValues(user));
  }, [user, isDirty, reset]);

  const changeImage = (field) => (url) => setValue(field, url, { shouldDirty: true });

  const onSubmit = async (values) => {
    const result = await dispatch(UpdateProfile(values));
    if (UpdateProfile.fulfilled.match(result)) {
      reset(toFormValues(result.payload.user));
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <ProfileHero
        profile={live}
        coverAction={<ImageMenu kind="cover" hasImage={!!live.cover} onChange={changeImage("cover")} />}
        photoAction={<ImageMenu kind="photo" hasImage={!!live.avatar} onChange={changeImage("avatar")} />}
      />

      <Box
        sx={{
          mt: { xs: 5, md: 7 },
          px: { xs: 2, md: 4 },
          display: "grid",
          gridTemplateColumns: { md: "minmax(0, 7fr) minmax(0, 5fr)" },
          columnGap: 8,
          rowGap: 6,
          alignItems: "start",
        }}
      >
        <Box component="section" aria-labelledby="details-title">
          <SectionTitle id="details-title">Name and status</SectionTitle>
          <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
              <RHFTextField name="firstName" label="First name" autoComplete="given-name" />
              <RHFTextField name="lastName" label="Last name" autoComplete="family-name" />
            </Stack>
            <RHFTextField
              name="activityStatus"
              label="Status"
              multiline
              minRows={2}
              helperText={
                <Box component="span" sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <span>Shown in the bubble beside your photo.</span>
                  <span>
                    {live.activityStatus.length}/{STATUS_LIMIT}
                  </span>
                </Box>
              }
            />
          </Stack>
        </Box>

        <Box component="section" aria-labelledby="summary-title">
          <SectionTitle id="summary-title">Your Whisprl so far</SectionTitle>
          <AccountSummary />
        </Box>
      </Box>

      <SaveBar visible={isDirty} saving={isSubmitting} onDiscard={() => reset()} />
    </FormProvider>
  );
};

export default ProfileEditor;
