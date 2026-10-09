import { useEffect } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import useHasSettled from "@/hooks/useHasSettled";
import { PAGE_HEIGHT_WITH_TAB_BAR } from "@/layouts/dashboard/NavRail";
import { GetRequests } from "@/redux/slices/actions/contactActions";
import { GetFriends } from "@/redux/slices/actions/userActions";
import { PATH_DASHBOARD } from "@/routes/paths";
import ContactsList from "@/sections/contacts/ContactsList";
import { FIND_PATH, REQUESTS_PATH, useContactsAddress } from "@/sections/contacts/contactsRoute";
import FindPeople from "@/sections/contacts/FindPeople";
import PersonPane from "@/sections/contacts/PersonPane";
import RequestsView from "@/sections/contacts/RequestsView";

const LIST_WIDTH = { md: 340, lg: 380 };

const PaneAt = ({ isRequests, isFinding, handle, onBack }) => {
  if (handle) return <PersonPane key={handle} handle={handle} onBack={onBack} />;
  if (isFinding) return <FindPeople onBack={onBack} />;
  if (isRequests) return <RequestsView onBack={onBack} />;
  return null;
};

// on a computer the list sits beside requests, people to find or a profile; on a phone each is a screen of its own
const Contacts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isWide = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const address = useContactsAddress();
  const hasRequests = useHasSettled(GetRequests);
  const isWaiting = useSelector((state) => state.contact.incoming.length > 0);
  const isBare = !address.isRequests && !address.isFinding && !address.handle;
  const isPaneShown = isWide || !isBare;
  const back = isWide ? undefined : () => navigate(PATH_DASHBOARD.general.contacts);

  useEffect(() => {
    dispatch(GetFriends());
  }, [dispatch]);

  // a computer opens on what needs you, and on finding people when nothing does
  useEffect(() => {
    if (isWide && isBare && hasRequests) navigate(isWaiting ? REQUESTS_PATH : FIND_PATH, { replace: true });
  }, [isWide, isBare, hasRequests, isWaiting, navigate]);

  return (
    <Box sx={{ display: "flex", flexGrow: 1, minWidth: 0, height: { xs: PAGE_HEIGHT_WITH_TAB_BAR, md: "100dvh" }, bgcolor: "chat.list" }}>
      {(isWide || !isPaneShown) && (
        <Box sx={{ width: { xs: "100%", ...LIST_WIDTH }, flexShrink: 0, borderRight: (theme) => ({ xs: "none", md: `1px solid ${theme.palette.divider}` }) }}>
          <ContactsList isWide={isWide} />
        </Box>
      )}
      {isPaneShown && (
        <Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: { md: "chat.canvas" } }}>
          <PaneAt {...address} onBack={back} />
        </Box>
      )}
    </Box>
  );
};

export default Contacts;
