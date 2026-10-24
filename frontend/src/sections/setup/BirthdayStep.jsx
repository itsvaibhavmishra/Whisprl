import * as Yup from "yup";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Stack, Switch, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useDispatch } from "react-redux";

import FormProvider, { RHFBirthdayPicker } from "@/components/hook-form";
import useIsLoading from "@/hooks/useIsLoading";
import { SaveBirthdayStep } from "@/redux/slices/actions/onboardingActions";
import { SettingRow, SettingsSection } from "@/sections/settings/SettingsSection";
import { signUpBirthdayRule } from "@/utils/formRules";

const BirthdaySchema = Yup.object({ birthday: signUpBirthdayRule });

const ChoiceRow = ({ name, label, description }) => (
  <Controller
    name={name}
    render={({ field }) => (
      <SettingRow label={label} description={description}>
        <Switch checked={field.value} onChange={(event) => field.onChange(event.target.checked)} inputProps={{ "aria-label": label }} />
      </SettingRow>
    )}
  />
);

const BirthdayStep = () => {
  const dispatch = useDispatch();
  const isSaving = useIsLoading(SaveBirthdayStep);
  const methods = useForm({
    mode: "onChange",
    resolver: yupResolver(BirthdaySchema),
    defaultValues: { birthday: "", showBirthdayToFriends: true, suggestToFriendsOfFriends: true },
  });

  return (
    <FormProvider methods={methods} onSubmit={methods.handleSubmit((values) => dispatch(SaveBirthdayStep(values)))}>
      <Stack spacing={4}>
        <Stack spacing={1}>
          <Typography component="h2" sx={{ m: 0, fontSize: 20, fontWeight: 700 }}>
            Your birthday
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Whisprl asks everyone for one. Friends see the day and month, never the year.
          </Typography>
          <RHFBirthdayPicker name="birthday" label="Birthday" />
        </Stack>
        <SettingsSection title="Who sees you">
          <ChoiceRow name="showBirthdayToFriends" label="Show my birthday to friends" description="On your profile and in their Birthdays this week." />
          <ChoiceRow
            name="suggestToFriendsOfFriends"
            label="Suggest me to friends of my friends"
            description="They can find you in People you may know. You can change both in Settings."
          />
        </SettingsSection>
        <LoadingButton type="submit" size="large" variant="contained" fullWidth loading={isSaving}>
          Continue
        </LoadingButton>
      </Stack>
    </FormProvider>
  );
};

export default BirthdayStep;
