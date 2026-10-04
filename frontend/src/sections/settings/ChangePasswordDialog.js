import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Info } from "phosphor-react";
import { useDispatch } from "react-redux";

import FormProvider, { PasswordChecklist, RHFPasswordField } from "@/components/hook-form";
import { ChangePassword } from "@/redux/slices/actions/userActions";
import { newPasswordRule } from "@/utils/formRules";

const ChangePasswordSchema = Yup.object({
  currentPassword: Yup.string().required("Enter your current password"),
  newPassword: newPasswordRule,
  confirmPassword: Yup.string()
    .required("Confirm your new password")
    .oneOf([Yup.ref("newPassword")], "Passwords do not match"),
});

const ChangePasswordDialog = ({ onClose }) => {
  const dispatch = useDispatch();

  const methods = useForm({
    resolver: yupResolver(ChangePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async ({ currentPassword, newPassword }) => {
    const result = await dispatch(ChangePassword({ currentPassword, newPassword }));
    if (ChangePassword.fulfilled.match(result)) onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="change-password-title"
      aria-describedby="change-password-description"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle id="change-password-title" sx={{ pb: 0.5 }}>
          Change password
        </DialogTitle>
        <DialogContent>
          <Typography id="change-password-description" variant="body2" sx={{ color: "text.secondary", fontWeight: 400 }}>
            You stay logged in here. Everywhere else logs out.
          </Typography>
          <Stack spacing={2.5} sx={{ mt: 3 }}>
            <RHFPasswordField name="currentPassword" label="Current password" autoComplete="current-password" autoFocus />
            <Stack spacing={1.5}>
              <RHFPasswordField name="newPassword" label="New password" autoComplete="new-password" />
              <PasswordChecklist name="newPassword" />
            </Stack>
            <RHFPasswordField name="confirmPassword" label="Confirm new password" autoComplete="new-password" />
          </Stack>
          <Box sx={{ mt: 3, p: 1.5, display: "flex", gap: 1.25, borderRadius: 2, bgcolor: "action.hover", color: "text.secondary" }}>
            <Box component={Info} size={18} aria-hidden="true" sx={{ flexShrink: 0, mt: 0.25 }} />
            <Typography variant="body2" sx={{ fontWeight: 400 }}>
              Signed up with Google, GitHub or LinkedIn? You have no password yet. Log out and use “Forgot your password?” to set one.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Change password
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default ChangePasswordDialog;
