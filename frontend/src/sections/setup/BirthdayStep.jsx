import * as Yup from "yup";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Stack, Switch, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import FormProvider, { RHFBirthdayPicker, RHFGenderPicker } from "@/components/hook-form";
import useIsLoading from "@/hooks/useIsLoading";
import { SaveBirthdayStep } from "@/redux/slices/actions/onboardingActions";
import { SettingRow, SettingsSection } from "@/sections/settings/SettingsSection";
import { genderRule, signUpBirthdayRule } from "@/utils/formRules";

const schemaFor = (asksGender) => Yup.object({ birthday: signUpBirthdayRule, ...(asksGender && { gender: genderRule }) });

const ChoiceRow = ({ name, label, description }) => (
  <Controller
    name={name}
    render={({ field }) => (
      <SettingRow label={label} description={description}>
        <Switch checked={field.value} onChange={(event) => field.onChange(event.target.checked)} slotProps={{ input: { "aria-label": label } }} />
      </SettingRow>
    )}
  />
);

const BirthdayStep = () => {
  const dispatch = useDispatch();
  const isSaving = useIsLoading(SaveBirthdayStep);
  const asksGender = useSelector((state) => !state.user.user.gender);
  const methods = useForm({
    mode: "onChange",
    resolver: yupResolver(schemaFor(asksGender)),
    defaultValues: { birthday: "", gender: "", showBirthdayToFriends: true, suggestToFriendsOfFriends: true },
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
        {asksGender && <RHFGenderPicker name="gender" />}
        <SettingsSection title="Who sees you">
          <ChoiceRow name="showBirthdayToFriends" label="Show my birthday to friends" description="On your profile and in their Birthdays this week." />
          <ChoiceRow
            name="suggestToFriendsOfFriends"
            label="Suggest me to friends of my friends"
            description="They can find you in People you may know. You can change both in Settings."
          />
        </SettingsSection>
        <Button type="submit" size="large" variant="contained" fullWidth loading={isSaving}>
          Continue
        </Button>
      </Stack>
    </FormProvider>
  );
};

export default BirthdayStep;
