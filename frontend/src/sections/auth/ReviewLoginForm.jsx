import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { Button, Stack } from "@mui/material";
import { useDispatch } from "react-redux";

import FormProvider, { RHFPasswordField, RHFTextField } from "@/components/hook-form";
import useIsLoading from "@/hooks/useIsLoading";
import { ReviewerLogin } from "@/redux/slices/actions/authActions";

const ReviewLoginSchema = Yup.object({
  email: Yup.string().trim().required("Enter the review account's email"),
  password: Yup.string().required("Password required"),
});

const ReviewLoginForm = () => {
  const dispatch = useDispatch();
  const isLoading = useIsLoading(ReviewerLogin);
  const methods = useForm({ resolver: yupResolver(ReviewLoginSchema), defaultValues: { email: "", password: "" } });

  return (
    <FormProvider methods={methods} onSubmit={methods.handleSubmit((values) => dispatch(ReviewerLogin(values)))}>
      <Stack spacing={2}>
        <RHFTextField name="email" label="Email address" type="email" autoComplete="username" />
        <RHFPasswordField name="password" label="Password" autoComplete="current-password" />
      </Stack>
      <Button loading={isLoading} fullWidth size="large" type="submit" variant="contained" sx={{ mt: 3 }}>
        Log in
      </Button>
    </FormProvider>
  );
};

export default ReviewLoginForm;
