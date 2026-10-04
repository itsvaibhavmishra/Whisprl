import { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  IconButton,
  InputAdornment,
  Stack,
} from "@mui/material";
import { Eye, EyeSlash } from "phosphor-react";
import { LoadingButton } from "@mui/lab";

import { useDispatch, useSelector } from "react-redux";
import { RegisterUser } from "../../redux/slices/actions/authActions";

import FormProvider, { RHFTextField } from "../../components/hook-form";

const RegisterForm = () => {
  const { isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const recaptchaRef = useRef(null);

  const RegisterSchema = Yup.object().shape({
    firstName: Yup.string()
      .required("First name required")
      .min(3, "First name must be at least 3 characters long")
      .max(16, "First name cannot be more than 16 characters long")
      .matches(/^[a-zA-Z]+$/, "Name can only contain alphabets"),
    lastName: Yup.string()
      .required("Last name required")
      .min(3, "Last name must be at least 3 characters long")
      .max(16, "Last name cannot be more than 16 characters long")
      .matches(/^[a-zA-Z]+$/, "Name can only contain alphabets"),

    email: Yup.string().required("Email Required").email("Invalid Email"),

    password: Yup.string()
      .required("Password Required")
      .min(8, "Password must be 8 characters long")
      .max(16, "Password cannot be more than 16 characters")
      .matches(/[0-9]/, "Password requires a number")
      .matches(/[a-z]/, "Password requires a lowercase letter")
      .matches(/[A-Z]/, "Password requires an uppercase letter")
      .matches(/[^\w]/, "Password requires a symbol"),
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
        <RHFTextField
          name="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                >
                  {showPassword ? <Eye /> : <EyeSlash />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

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
