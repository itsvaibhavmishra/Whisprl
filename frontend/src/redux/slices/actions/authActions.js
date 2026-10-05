import { createAsyncThunk } from "@reduxjs/toolkit";

import { ShowSnackbar, logout, updateUser } from "../userSlice";

import axios from "../../../utils/axios";
import { updateOtpEmail } from "../authSlice";
import { clearChat } from "../chatSlice";
import { ForgetDeviceKeys } from "@/redux/slices/actions/encryptionActions";
import { socket } from "../../../utils/socket";

// ------------- Login Thunk -------------
export const LoginUser = createAsyncThunk(
  "auth/login",
  async ({ recaptchaRef, ...formValues }, { rejectWithValue, dispatch }) => {
    try {
      // generate recaptcha token
      const recaptchaToken = await recaptchaRef.current.executeAsync();

      const { data } = await axios.post("/auth/login", {
        ...formValues,
        recaptchaToken,
      });

      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: data.status,
          message: data.message,
        })
      );

      // if user is not verified
      if (!data.user) {
        dispatch(updateOtpEmail({ otpEmail: formValues.email }));
        setTimeout(() => {
          window.location.href = "/auth/verify";
        }, 1000);
      } else {
        // update user data
        dispatch(updateUser(data.user));
      }

      return data;
    } catch (error) {
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Logout Thunk -------------
export const LogoutUser = createAsyncThunk(
  "auth/logout",
  async (arg, { rejectWithValue, dispatch, getState }) => {
    return new Promise(async (resolve) => {
      try {
        const { data } = await axios.post("/auth/logout");

        await dispatch(ForgetDeviceKeys(getState().user.user._id));
        dispatch(clearChat());
        dispatch(logout());
        socket.disconnect();

        // show snackbar
        dispatch(
          ShowSnackbar({
            severity: data.status,
            message: data.message,
          })
        );

        // Resolve the promise to indicate that the operation is complete
        resolve();
      } catch (error) {
        dispatch(
          ShowSnackbar({
            severity: error?.error?.status || "error",
            message: error?.error?.message || "logout failed",
          })
        );

        return rejectWithValue(error);
      }
    });
  }
);

// ------------- Register Thunk -------------
export const RegisterUser = createAsyncThunk(
  "auth/register",
  async (
    { recaptchaRef, ...formValues },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      // generate recaptcha token
      const recaptchaToken = await recaptchaRef.current.executeAsync();

      const { data } = await axios.post("/auth/register", {
        ...formValues,
        recaptchaToken,
      });

      // update otp email
      dispatch(updateOtpEmail({ otpEmail: formValues.email }));

      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: data.status,
          message: data.message,
        })
      );

      if (!getState().auth.error) {
        setTimeout(() => {
          window.location.href = "/auth/verify";
        }, 1000);
      }

      return data;
    } catch (error) {
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Verify OTP Thunk -------------
export const VerifyOTP = createAsyncThunk(
  "auth/verify-otp",
  async (
    { recaptchaRef, ...formValues },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      // generate recaptcha token
      const recaptchaToken = await recaptchaRef.current.executeAsync();

      const { data } = await axios.post("/auth/verify-otp", {
        ...formValues,
        recaptchaToken,
      });

      // update user data
      dispatch(updateUser(data.user));

      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: data.status,
          message: data.message,
        })
      );

      return data;
    } catch (error) {
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Send OTP Thunk -------------
export const SendOTP = createAsyncThunk(
  "auth/send-otp",
  async (formValues, { rejectWithValue, dispatch, getState }) => {
    // update otp email
    dispatch(updateOtpEmail({ otpEmail: formValues.email }));

    try {
      const { data } = await axios.post("/auth/send-otp", {
        ...formValues,
      });

      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: data.status,
          message: data.message,
        })
      );

      return data;
    } catch (error) {
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Add Email Thunk -------------
export const AddOtpEmail = createAsyncThunk(
  "auth/addOtpEmail",
  async (formValues, { rejectWithValue, dispatch, getState }) => {
    try {
      // update otp email
      dispatch(updateOtpEmail({ otpEmail: formValues.email }));

      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: "success",
          message: "Email Added Successfully",
        })
      );
    } catch (error) {
      dispatch(
        ShowSnackbar({
          severity: error,
          message: "Could not add email",
        })
      );
      return rejectWithValue(error);
    }
  }
);

// ------------- Forgot Password Thunk -------------
export const ForgotPassword = createAsyncThunk(
  "auth/forgot-password",
  async (
    { recaptchaRef, ...formValues },
    { rejectWithValue, dispatch, getState }
  ) => {
    // generate recaptcha token
    const recaptchaToken = await recaptchaRef.current.executeAsync();

    try {
      const { data } = await axios.post("/auth/forgot-password", {
        ...formValues,
        recaptchaToken,
      });

      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: data.status,
          message: data.message,
        })
      );

      return data;
    } catch (error) {
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Reset Password Thunk -------------
export const ResetPassword = createAsyncThunk(
  "auth/reset-password",
  async (formValues, { rejectWithValue, dispatch, getState }) => {
    try {
      const { data } = await axios.post("/auth/reset-password", {
        ...formValues,
      });

      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: data.status,
          message: data.message,
        })
      );

      return data;
    } catch (error) {
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Refresh Token Thunk -------------
export const RefreshToken = createAsyncThunk(
  "auth/refresh-token",
  async (arg, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.post("/auth/refresh-token/");

      // if user is not verified
      if (!data.user) {
        alert("Token expired, Logging you out...");
        dispatch(LogoutUser());
      } else {
        // update user data
        dispatch(updateUser(data.user));
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Start Server Thunk -------------
export const StartServer = createAsyncThunk(
  "start/server",
  async (arg, { rejectWithValue, dispatch }) => {
    try {
      await axios.get("/start-server");
    } catch (error) {
      console.log(error);
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error);
    }
  }
);

// ------------- Google Login Thunk -------------
export const GoogleLogin = createAsyncThunk(
  "auth/google",
  async (token, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.post("/auth/google", {
        code: token.access_token,
      });

      console.clear();

      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: data.status,
          message: data.message,
        })
      );

      // update user data
      dispatch(updateUser(data.user));

      return data;
    } catch (error) {
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- GitHub Login Thunk -------------
export const GithubLogin = createAsyncThunk(
  "auth/github",
  async (code, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.post("/auth/github", { code: code });

      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: data.status,
          message: data.message,
        })
      );

      // update user data
      dispatch(updateUser(data.user));

      return data;
    } catch (error) {
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- GitHub Login Thunk -------------
export const LinkedinLogin = createAsyncThunk(
  "auth/linkedin",
  async (code, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.post("/auth/linkedin", { code: code });

      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: data.status,
          message: data.message,
        })
      );

      // update user data
      dispatch(updateUser(data.user));

      return data;
    } catch (error) {
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);
