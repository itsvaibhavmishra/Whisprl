import * as Yup from "yup";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Typography } from "@mui/material";
import { useDispatch } from "react-redux";

import FormProvider from "@/components/hook-form";
import useIsLoading from "@/hooks/useIsLoading";
import { SaveBirthdayStep } from "@/redux/slices/actions/onboardingActions";
import BirthdayWheel from "@/sections/setup/BirthdayWheel";
import { signUpBirthdayRule } from "@/utils/formRules";

const BirthdaySchema = Yup.object({ birthday: signUpBirthdayRule });

const BirthdayStep = () => {
  const dispatch = useDispatch();
  const isSaving = useIsLoading(SaveBirthdayStep);
  const methods = useForm({ resolver: yupResolver(BirthdaySchema), defaultValues: { birthday: "" } });
  const birthday = useWatch({ control: methods.control, name: "birthday" });

  return (
    <FormProvider methods={methods} onSubmit={methods.handleSubmit((values) => dispatch(SaveBirthdayStep(values)))}>
      <BirthdayWheel name="birthday" />
      <Typography variant="body2" sx={{ mt: 3, textAlign: "center", color: "text.secondary" }}>
        Friends see the day and month, never the year.
      </Typography>
      <Button type="submit" size="large" variant="contained" fullWidth disabled={!birthday} loading={isSaving} sx={{ mt: 4 }}>
        Continue
      </Button>
    </FormProvider>
  );
};

export default BirthdayStep;
