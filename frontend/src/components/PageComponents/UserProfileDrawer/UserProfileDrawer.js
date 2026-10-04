import { useEffect } from "react";

import { Drawer, Box, IconButton, Skeleton, useTheme } from "@mui/material";
import { X } from "phosphor-react";

import ProfileHero from "@/components/ProfileHero";
import { UserDrawerMain } from "./UserDrawerComps";

// redux imports
import { useDispatch, useSelector } from "react-redux";
import { GetUserData } from "../../../redux/slices/actions/contactActions";

const UserProfileDrawer = ({
  openDrawer,
  toggleDrawer,
  selectedUserData,
  isFrom,
  isRequestSent,
}) => {
  const theme = useTheme();

  // from redux
  const dispatch = useDispatch();
  const { userData, isUserDataLoading } = useSelector((state) => state.contact);

  useEffect(() => {
    if (selectedUserData?._id && openDrawer === true) {
      dispatch(GetUserData(selectedUserData?._id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openDrawer]);

  return (
    <Drawer
      anchor="bottom"
      open={openDrawer}
      onClose={toggleDrawer}
      PaperProps={{
        sx: { height: "90%" },
      }}
    >
      <Box
        width={"100%"}
        height={"100%"}
        className={"scrollbar"}
        sx={{
          backgroundColor: theme.palette.background.default,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <Box sx={{ position: "relative", maxWidth: 1040, mx: "auto", p: { xs: 2, md: 3 } }}>
          {isUserDataLoading || !userData ? (
            <Skeleton variant="rounded" sx={{ aspectRatio: "3 / 1", height: "auto", borderRadius: "28px" }} />
          ) : (
            <ProfileHero profile={userData} />
          )}
          <IconButton
            aria-label="Close profile"
            onClick={toggleDrawer}
            sx={{ position: "absolute", top: { xs: 28, md: 36 }, left: { xs: 28, md: 36 }, bgcolor: "background.paper", "&:hover": { bgcolor: "background.default" } }}
          >
            <X size={20} />
          </IconButton>
        </Box>

        {/* Main */}
        <UserDrawerMain
          toggleDrawer={toggleDrawer}
          userData={userData}
          isLoading={isUserDataLoading}
          isFrom={isFrom}
          isRequestSent={isRequestSent}
        />
      </Box>
    </Drawer>
  );
};
export default UserProfileDrawer;
