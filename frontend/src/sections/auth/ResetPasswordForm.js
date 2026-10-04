import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Stack } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useSearchParams } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import { ResetPassword } from "../../redux/slices/actions/authActions";

import { newPasswordRule } from "@/utils/formRules";
import FormProvider, { PasswordChecklist, RHFPasswordField } from "@/components/hook-form";

const ResetPasswordForm = () => {
  const { isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [queryParameters] = useSearchParams();


  const NewPasswordSchema = Yup.object().shape({
    password: newPasswordRule,

    passwordConfirm: Yup.string()
      .required("Password Required")
      .oneOf([Yup.ref("password"), null], "Password does not match"),
  });

  const defaultValues = {
    password: "",
    passwordConfirm: "",
  };

  const methods = useForm({
    mode: "onChange",
    resolver: yupResolver(NewPasswordSchema),
    defaultValues,
  });

  const { handleSubmit } = methods;

  const onSubmit = async (data) => {
    try {
      dispatch(ResetPassword({ ...data, token: queryParameters.get("code") }));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <RHFPasswordField name="password" label="New password" autoComplete="new-password" />
        <PasswordChecklist name="password" />
        <RHFPasswordField name="passwordConfirm" label="Confirm new password" autoComplete="new-password" />
        <LoadingButton
          loading={isLoading}
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          sx={{ mt: 3 }}
        >
          Set new password
        </LoadingButton>
      </Stack>
    </FormProvider>
  );
};

export default ResetPasswordForm;
