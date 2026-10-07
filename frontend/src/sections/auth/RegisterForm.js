import { useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Stack } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import { useDispatch } from "react-redux";
import { RegisterUser } from "@/redux/slices/actions/authActions";

import { nameRule, newPasswordRule } from "@/utils/formRules";
import { PATH_AUTH } from "@/routes/paths";
import FormProvider, { PasswordChecklist, RHFPasswordField, RHFTextField } from "@/components/hook-form";
import useIsLoading from "@/hooks/useIsLoading";

const RegisterForm = () => {
  const isLoading = useIsLoading(RegisterUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
    const result = await dispatch(RegisterUser({ ...data, recaptchaRef }));
    if (RegisterUser.fulfilled.match(result)) navigate(PATH_AUTH.general.verify);
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
