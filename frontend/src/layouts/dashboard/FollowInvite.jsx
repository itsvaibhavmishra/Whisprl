import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { JoinThroughInvite } from "@/redux/slices/actions/contactActions";
import { contactPathOf } from "@/sections/contacts/contactsRoute";
import { forgetInvite, rememberedInvite } from "@/utils/invite";

// an invite followed before signing up opens the inviter's profile once setup is done, and a failed lookup waits for the next visit
const FollowInvite = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const meId = useSelector((state) => state.user.user._id);

  useEffect(() => {
    const code = rememberedInvite();
    if (!code) return;
    dispatch(JoinThroughInvite(code)).then((result) => {
      if (JoinThroughInvite.rejected.match(result)) return;
      forgetInvite();
      if (result.payload && result.payload._id !== meId) navigate(contactPathOf(result.payload), { replace: true });
    });
  }, [dispatch, navigate, meId]);

  return null;
};

export default FollowInvite;
