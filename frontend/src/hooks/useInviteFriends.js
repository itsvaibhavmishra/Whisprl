import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { GetInviteCode } from "@/redux/slices/actions/contactActions";
import { shareInvite } from "@/sections/contacts/contactsRoute";

// the code is fetched ahead, since a phone opens its share sheet only straight from the tap
const useInviteFriends = () => {
  const dispatch = useDispatch();
  const code = useSelector((state) => state.contact.inviteCode);

  useEffect(() => {
    if (!code) dispatch(GetInviteCode());
  }, [dispatch, code]);

  return code ? () => shareInvite(code) : null;
};

export default useInviteFriends;
