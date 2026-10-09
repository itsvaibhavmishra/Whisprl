import AuthHeader, { BackToLogin } from "@/sections/auth/AuthHeader";

const SignUpPaused = () => (
  <>
    <AuthHeader title="We can't create your account">
      Whisprl isn&apos;t available to you based on the details you entered.
    </AuthHeader>
    <BackToLogin sx={{ mt: 0 }} />
  </>
);

export default SignUpPaused;
