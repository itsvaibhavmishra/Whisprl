import { useState } from "react";
import * as Yup from "yup";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Box, Button, ButtonBase, InputAdornment, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CheckIcon, GenderFemaleIcon, GenderMaleIcon } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";

import FormProvider, { RHFTextField } from "@/components/hook-form";
import { useCroppedImage } from "@/components/ImageMenu";
import useIsLoading from "@/hooks/useIsLoading";
import useUsernameCheck from "@/hooks/useUsernameCheck";
import { SaveProfileStep } from "@/redux/slices/actions/onboardingActions";
import AvatarCarousel from "@/sections/setup/AvatarCarousel";
import { AVATAR_PRESETS, presetPathOf } from "@/utils/avatarPresets";
import { nameRule } from "@/utils/formRules";
import { GENDERS, GENDER_NOTE } from "@/utils/genders";

const ProfileSchema = Yup.object({
  name: nameRule,
  username: Yup.string().trim().required("Pick a username"),
  gender: Yup.string().required("Choose one, or prefer not to say"),
});

const choicesOf = (user, uploaded) => {
  const presets = AVATAR_PRESETS.map((preset) => ({ key: preset.id, src: presetPathOf(preset.id), label: preset.label }));
  const middle = Math.ceil(presets.length / 2);
  const own = [
    ...(uploaded ? [{ key: "upload", src: uploaded, label: "Your uploaded photo" }] : []),
    { key: "own", src: user.avatar ?? "", label: user.avatar ? "Your photo" : "Your initial" },
  ];
  return [...presets.slice(0, middle), ...own, ...presets.slice(middle)];
};

const isPreset = (key) => AVATAR_PRESETS.some((preset) => preset.id === key);

const GENDER_LOOKS = { male: { Icon: GenderMaleIcon, colour: "#3B82F6" }, female: { Icon: GenderFemaleIcon, colour: "#EC4899" } };

const labelOf = (value) => GENDERS.find((gender) => gender.value === value).label;

const GenderChoice = ({ value, onChange, error }) => (
  <Box role="radiogroup" aria-label="Gender">
    <Stack direction="row" spacing={1.5}>
      {Object.entries(GENDER_LOOKS).map(([gender, { Icon, colour }]) => {
        const isChosen = value === gender;
        return (
          <Button
            key={gender}
            role="radio"
            aria-checked={isChosen}
            variant="outlined"
            color="inherit"
            size="large"
            startIcon={<Icon weight="bold" />}
            onClick={() => onChange(gender)}
            sx={{
              flex: 1,
              borderRadius: 99,
              borderColor: isChosen ? colour : "divider",
              bgcolor: isChosen ? alpha(colour, 0.08) : "transparent",
              "& .MuiButton-startIcon": { color: isChosen ? colour : "text.disabled" },
            }}
          >
            {labelOf(gender)}
          </Button>
        );
      })}
    </Stack>
    <Stack sx={{ alignItems: "center", mt: 1 }}>
      <ButtonBase
        role="radio"
        aria-checked={value === "undisclosed"}
        onClick={() => onChange("undisclosed")}
        sx={{
          gap: 0.75,
          px: 1.5,
          py: 0.75,
          borderRadius: 99,
          fontSize: 14,
          fontWeight: 600,
          color: value === "undisclosed" ? "primary.main" : "text.secondary",
        }}
      >
        {value === "undisclosed" && <CheckIcon size={16} weight="bold" />}
        {labelOf("undisclosed")}
      </ButtonBase>
      <Typography variant="body2" sx={{ textAlign: "center", color: error ? "error.main" : "text.secondary" }}>
        {error ?? GENDER_NOTE}
      </Typography>
    </Stack>
  </Box>
);

const ProfileStep = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const isSaving = useIsLoading(SaveProfileStep);
  const [chosen, setChosen] = useState("own");
  const [uploaded, setUploaded] = useState(null);
  const { pick, picker } = useCroppedImage("photo", (photo) => {
    setUploaded(photo);
    setChosen("upload");
  });

  const methods = useForm({
    resolver: yupResolver(ProfileSchema),
    defaultValues: { name: user.name ?? "", username: user.username ?? "", gender: user.gender ?? "" },
  });
  const [username, gender] = useWatch({ control: methods.control, name: ["username", "gender"] });
  const usernameCheck = useUsernameCheck(username, user.username);
  const canContinue = usernameCheck.isUnchanged || usernameCheck.isFree;

  const save = (values) =>
    dispatch(
      SaveProfileStep({
        ...values,
        username: usernameCheck.wanted,
        preset: isPreset(chosen) ? chosen : undefined,
        photo: chosen === "upload" ? uploaded : undefined,
      })
    );

  return (
    <FormProvider methods={methods} onSubmit={methods.handleSubmit(save)}>
      <Stack spacing={3}>
        <AvatarCarousel choices={choicesOf(user, uploaded)} chosen={chosen} name={user.name} onChoose={setChosen} onUpload={pick} />
        {picker}
        <RHFTextField name="name" label="Name" autoComplete="name" />
        <RHFTextField
          name="username"
          label="Username"
          {...(usernameCheck.problem && { error: true })}
          helperText={usernameCheck.status ?? "People find you by it."}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">@</InputAdornment> },
            htmlInput: { maxLength: 21, autoCapitalize: "none", spellCheck: false },
            formHelperText: { sx: { color: usernameCheck.isFree ? "success.main" : undefined } },
          }}
        />
        <GenderChoice
          value={gender}
          onChange={(value) => methods.setValue("gender", value, { shouldValidate: true })}
          error={methods.formState.errors.gender?.message}
        />
        <Button type="submit" size="large" variant="contained" fullWidth disabled={!canContinue} loading={isSaving}>
          Continue
        </Button>
      </Stack>
    </FormProvider>
  );
};

export default ProfileStep;
