import { Button } from "@mui/material";
import { useDispatch } from "react-redux";

import { LogoutUser } from "@/redux/slices/actions/authActions";
import AuthHeader from "@/sections/auth/AuthHeader";

// nothing else on this page can be done, so logging out is the one way off it
const SetupPaused = () => {
  const dispatch = useDispatch();
  return (
    <>
      <AuthHeader title="We can't set up your account">Whisprl isn&apos;t available to you based on the details you entered.</AuthHeader>
      <Button size="large" variant="outlined" color="inherit" fullWidth onClick={() => dispatch(LogoutUser())}>
        Log out
      </Button>
    </>
  );
};

export default SetupPaused;
