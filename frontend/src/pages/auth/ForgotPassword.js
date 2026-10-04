import AuthHeader, { BackToLogin } from "@/sections/auth/AuthHeader";
import ForgotPasswordForm from "@/sections/auth/ForgotPasswordForm";

const ForgotPassword = () => (
  <>
    <AuthHeader title="Reset your password">
      Enter the email you signed up with and we will send you a link to set a new
      password.
    </AuthHeader>
    <ForgotPasswordForm />
    <BackToLogin />
  </>
);

export default ForgotPassword;
