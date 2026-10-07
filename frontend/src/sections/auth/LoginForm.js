import { useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { Link, Stack } from "@mui/material";
import { Key } from "phosphor-react";
import { LoadingButton } from "@mui/lab";

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
    const result = await dispatch(LoginUser({ ...data, recaptchaRef }));
    if (LoginUser.fulfilled.match(result) && !result.payload.user) navigate(PATH_AUTH.general.verify);
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

      {canUsePasskeys() && (
        <LoadingButton
          loading={isUsingPasskey}
          fullWidth
          size="large"
          variant="outlined"
          color="inherit"
          startIcon={<Key weight="bold" />}
          onClick={() => dispatch(PasskeyLogin())}
          sx={{ mt: 1.5 }}
        >
          Log in with a passkey
        </LoadingButton>
      )}
    </FormProvider>
  );
};

export default LoginForm;
