import { useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Stack } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import { useDispatch, useSelector } from "react-redux";
import {
  AddOtpEmail,
  SendOTP,
  VerifyOTP,
} from "../../redux/slices/actions/authActions";

import FormProvider, { RHFOtp, RHFTextField } from "../../components/hook-form";

export const EmailForm = () => {
  const { isLoading } = useSelector((state) => state.auth);
  const { otpEmail } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const EmailSchema = Yup.object().shape({
    email: Yup.string().required("Email Required").email("Invalid Email"),
  });

  const defaultValues = {
    email: otpEmail || "",
  };

  const methods = useForm({
    resolver: yupResolver(EmailSchema),
    defaultValues,
  });

  const { handleSubmit } = methods;

  const onSubmit = async (data) => {
    if (otpEmail) {
      try {
        dispatch(SendOTP(data));
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        dispatch(AddOtpEmail(data));
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <RHFTextField
        name="email"
        label="Email address"
        helperText={
          otpEmail
            ? "The code went to this address. Resend it if it has not arrived."
            : "Send a code to this address first."
        }
        InputProps={{
          endAdornment: (
            <LoadingButton
              loading={isLoading}
              size="small"
              type="submit"
              variant="outlined"
              sx={{ flexShrink: 0, whiteSpace: "nowrap", ml: 1 }}
            >
              {otpEmail ? "Resend code" : "Send code"}
            </LoadingButton>
          ),
        }}
      />
    </FormProvider>
  );
};

const VerifyForm = () => {
  const { isLoading } = useSelector((state) => state.auth);
  const { otpEmail } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const recaptchaRef = useRef(null);

  const VerifySchema = Yup.object().shape({
    otp1: Yup.string().required("Required"),
    otp2: Yup.string().required("Required"),
    otp3: Yup.string().required("Required"),
    otp4: Yup.string().required("Required"),
    otp5: Yup.string().required("Required"),
    otp6: Yup.string().required("Required"),
  });

  const defaultValues = {
    otp1: "",
    otp2: "",
    otp3: "",
    otp4: "",
    otp5: "",
    otp6: "",
  };

  const methods = useForm({
    mode: "onChange",
    resolver: yupResolver(VerifySchema),
    defaultValues,
  });

  const { handleSubmit } = methods;

  const onSubmit = async (data) => {
    try {
      dispatch(
        VerifyOTP({
          email: otpEmail,
          otp: `${data.otp1}${data.otp2}${data.otp3}${data.otp4}${data.otp5}${data.otp6}`,
          recaptchaRef,
        })
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3} sx={{ mt: 3 }}>
        <RHFOtp
          disabled={!otpEmail}
          keyName="otp"
          inputs={["otp1", "otp2", "otp3", "otp4", "otp5", "otp6"]}
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
          disabled={!otpEmail}
          sx={{ mt: 1 }}
        >
          Verify email
        </LoadingButton>
      </Stack>
    </FormProvider>
  );
};

export default VerifyForm;
