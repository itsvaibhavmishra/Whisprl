import { useEffect, useState } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { ArrowsDownUpIcon } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import BadgeArranger from "@/sections/badges/BadgeArranger";
import Pane, { READING_WIDTH } from "@/components/Pane";
import { PAGE_HEIGHT_WITH_TAB_BAR } from "@/layouts/dashboard/NavRail";
import { GetUserData } from "@/redux/slices/actions/contactActions";
import { DEFAULT_PATH } from "@/config";
import BadgeGallery from "@/sections/badges/BadgeGallery";
import BadgeProgress from "@/sections/badges/BadgeProgress";

const Badges = ({ isProgress = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useParams();
  const me = useSelector((state) => state.user.user);
  const isOwn = me._id === userId;
  const fetched = useSelector((state) => state.contact.profiles[userId]);
  // your own badges are kept with you, so your gallery opens at once and stays current with the app's own checks
  const person = isOwn ? me : fetched;
  const [isArranging, setIsArranging] = useState(false);
  const canArrange = isOwn && !isProgress && person?.badges?.length > 0;

  useEffect(() => {
    if (!isOwn) dispatch(GetUserData(userId));
  }, [dispatch, isOwn, userId]);

  // a gallery opened from a shared link has nothing behind it to go back to, so it goes to the chats
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate(DEFAULT_PATH, { replace: true }));

  return (
    <Box component="main" sx={{ flex: 1, minWidth: 0, height: { xs: PAGE_HEIGHT_WITH_TAB_BAR, md: "100dvh" } }}>
      <Pane
        title={isProgress ? "Progress" : "Badges"}
        onBack={goBack}
        width={READING_WIDTH}
        action={
          canArrange && (
            <Tooltip title="Arrange badges">
              <IconButton aria-label="Arrange badges" onClick={() => setIsArranging(true)}>
                <ArrowsDownUpIcon size={22} />
              </IconButton>
            </Tooltip>
          )
        }
      >
        {person && (isProgress ? <BadgeProgress person={person} isOwn={isOwn} /> : <BadgeGallery person={person} isOwn={isOwn} />)}
      </Pane>
      {isArranging && <BadgeArranger badges={person.badges} onClose={() => setIsArranging(false)} />}
    </Box>
  );
};

export default Badges;
