import { useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Stack } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import { useDispatch, useSelector } from "react-redux";
import { RegisterUser } from "@/redux/slices/actions/authActions";

import { nameRule, newPasswordRule } from "@/utils/formRules";
import FormProvider, { PasswordChecklist, RHFPasswordField, RHFTextField } from "@/components/hook-form";

const RegisterForm = () => {
  const { isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const recaptchaRef = useRef(null);

  const RegisterSchema = Yup.object().shape({
    firstName: nameRule("First name"),
    lastName: nameRule("Last name"),

    email: Yup.string().required("Email Required").email("Invalid Email"),

    password: newPasswordRule,
  });

  const defaultValues = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  };

  const methods = useForm({
    mode: "onChange",
    resolver: yupResolver(RegisterSchema),
    defaultValues,
  });

  const { handleSubmit } = methods;

  const onSubmit = async (data) => {
    try {
      dispatch(RegisterUser({ ...data, recaptchaRef }));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ md: "flex-start" }}
          spacing={2}
          justifyContent={"center"}
        >
          <RHFTextField name="firstName" label="First name" />
          <RHFTextField name="lastName" label="Last name" />
        </Stack>
        <RHFTextField name="email" label="Email address" />
        <RHFPasswordField name="password" label="Password" autoComplete="new-password" />
        <PasswordChecklist name="password" />

        <ReCAPTCHA
          ref={recaptchaRef}
          size="invisible"
          sitekey={process.env.REACT_APP_RECAPTCHA_CLIENT}
          theme="dark"
        />

        <LoadingButton
          loading={isLoading}
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          sx={{ mt: 3 }}
        >
          Create account
        </LoadingButton>
      </Stack>
    </FormProvider>
  );
};

export default RegisterForm;
