import { useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Link as RouterLink } from "react-router-dom";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { Link, Stack } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import { useDispatch, useSelector } from "react-redux";
import { LoginUser } from "@/redux/slices/actions/authActions";

import FormProvider, { RHFPasswordField, RHFTextField } from "@/components/hook-form";

const LoginForm = () => {
  const { isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const recaptchaRef = useRef(null);

  const LoginSchema = Yup.object().shape({
    email: Yup.string().required("Email Required").email("Invalid Email"),
    password: Yup.string().required("Password required"),
  });

  const defaultValues = {
    email: "",
    password: "",
  };

  const methods = useForm({
    mode: "onChange",
    resolver: yupResolver(LoginSchema),
    defaultValues,
  });

  const { handleSubmit } = methods;

  const onSubmit = async (data) => {
    try {
      dispatch(LoginUser({ ...data, recaptchaRef }));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <RHFTextField name="email" label="Email address" />
        <RHFPasswordField name="password" label="Password" autoComplete="current-password" />
      </Stack>
      <Stack alignItems="flex-end" sx={{ mt: 1.5 }}>
        <Link
          to="/auth/forgot-password"
          component={RouterLink}
          variant="body2"
          color="inherit"
          underline="hover"
        >
          Forgot your password?
        </Link>
      </Stack>

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
        Log in
      </LoadingButton>
    </FormProvider>
  );
};

export default LoginForm;
