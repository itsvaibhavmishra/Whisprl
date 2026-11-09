import { useEffect } from "react";
import { useParams } from "react-router-dom";

import AuthLayout from "@/layouts/auth";
import { rememberInvite } from "@/utils/invite";

// remembered before the auth pages take over, so someone already signed in is still taken to whoever invited them
const InviteLayout = () => {
  const { code } = useParams();

  useEffect(() => {
    rememberInvite(code);
  }, [code]);

  return <AuthLayout />;
};

export default InviteLayout;
