import { useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { Button, Link, Stack } from "@mui/material";
import { KeyIcon } from "@phosphor-icons/react";

import { useDispatch } from "react-redux";
import { LoginUser, PasskeyLogin } from "@/redux/slices/actions/authActions";

import FormProvider, { RHFPasswordField, RHFTextField } from "@/components/hook-form";
import { PATH_AUTH } from "@/routes/paths";
import { canUsePasskeys } from "@/utils/passkeys";
import useIsLoading from "@/hooks/useIsLoading";

const LoginForm = () => {
  const isLoading = useIsLoading(LoginUser);
  const isUsingPasskey = useIsLoading(PasskeyLogin);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const recaptchaRef = useRef(null);

  const LoginSchema = Yup.object().shape({
    identifier: Yup.string().trim().required("Enter your email or username"),
    password: Yup.string().required("Password required"),
  });

  const defaultValues = {
    identifier: "",
    password: "",
  };

  const methods = useForm({
    mode: "onChange",
    resolver: yupResolver(LoginSchema),
    defaultValues,
  });

  const { handleSubmit } = methods;

  const onSubmit = async (data) => {
    const result = await dispatch(LoginUser({ ...data, recaptchaRef }));
    if (LoginUser.fulfilled.match(result) && !result.payload.user) navigate(PATH_AUTH.general.verify);
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <RHFTextField name="identifier" label="Email or username" autoComplete="username" />
        <RHFPasswordField name="password" label="Password" autoComplete="current-password" />
      </Stack>
      <Stack sx={{ alignItems: "flex-end", mt: 1.5 }}>
        <Link to="/auth/forgot-password" component={RouterLink} variant="body2" color="inherit" underline="hover">
          Forgot your password?
        </Link>
      </Stack>

      <ReCAPTCHA ref={recaptchaRef} size="invisible" sitekey={import.meta.env.REACT_APP_RECAPTCHA_CLIENT} theme="dark" />

      <Button loading={isLoading} fullWidth size="large" type="submit" variant="contained" sx={{ mt: 3 }}>
        Log in
      </Button>

      {canUsePasskeys() && (
        <Button
          loading={isUsingPasskey}
          fullWidth
          size="large"
          variant="outlined"
          color="inherit"
          startIcon={<KeyIcon weight="bold" />}
          onClick={() => dispatch(PasskeyLogin())}
          sx={{ mt: 1.5 }}
        >
          Log in with a passkey
        </Button>
      )}
    </FormProvider>
  );
};

export default LoginForm;
