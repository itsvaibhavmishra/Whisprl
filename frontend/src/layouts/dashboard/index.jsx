import { useEffect } from "react";
import { Box, Stack } from "@mui/material";
import { MotionConfig } from "motion/react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector, useStore } from "react-redux";

import MotionLazyContainer from "@/components/animate/MotionLazyContainer";
import { PageArea } from "@/components/LoadingScreen";
import NotificationsPrompt from "@/components/NotificationsPrompt";
import useSettings from "@/hooks/useSettings";
import NavRail from "@/layouts/dashboard/NavRail";
import { GetOnlineFriends } from "@/redux/slices/actions/userActions";
import { DeliverWaitingMessages, GetConversations } from "@/redux/slices/actions/chatActions";
import { PrepareEncryption } from "@/redux/slices/actions/encryptionActions";
import { RegisterPushDevice } from "@/redux/slices/actions/pushActions";
import { ConnectSocket } from "@/redux/slices/actions/socketActions";
import { GetDiscover, GetStatuses } from "@/redux/slices/actions/statusActions";
import { selectIsLoading } from "@/redux/slices/requestSlice";
import { PATH_SETUP } from "@/routes/paths";
import { chatPath } from "@/sections/chat/chatRoute";
import EncryptionGate from "@/sections/encryption/EncryptionGate";
import { reportErrorsAs } from "@/utils/errorReports";
import { openNotifiedChat, setChatOpener } from "@/utils/notifications";
import { needsSetup } from "@/utils/onboarding";
import { isApp } from "@/utils/platform";
import { listenForPushTaps } from "@/utils/push";

// pages here run up under the status bar and pad themselves below it, so the loader steps below it too
const PAGE_AREA = { isUnderStatusBar: true };

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useSelector((state) => state.auth);
  const userId = useSelector((state) => state.user.user._id);
  const isEncryptionReady = useSelector((state) => state.encryption.status === "ready");
  const isSetUp = useSelector((state) => !needsSetup(state.user.user.onboarding));
  const store = useStore();
  const { notifications } = useSettings();

  useEffect(() => {
    if (!isLoggedIn || !userId || !isSetUp) return;

    dispatch(ConnectSocket());
    // previews can only be decrypted once this browser's key is loaded
    dispatch(PrepareEncryption()).then(() => {
      dispatch(GetConversations());
      dispatch(DeliverWaitingMessages());
    });
    dispatch(GetOnlineFriends());
  }, [dispatch, isLoggedIn, userId, isSetUp]);

  // read from the store as it is now: a login may still be checking its keys, or the Status page may already be loading them
  useEffect(() => {
    const state = store.getState();
    if (state.encryption.status !== "ready") return;
    if (!selectIsLoading(state, GetStatuses)) dispatch(GetStatuses());
    if (!selectIsLoading(state, GetDiscover)) dispatch(GetDiscover());
  }, [dispatch, store, isEncryptionReady]);

  // a phone's push token can change between launches, so it is sent again every time the app opens
  useEffect(() => {
    if (isApp && isLoggedIn && userId && isSetUp && notifications) dispatch(RegisterPushDevice());
  }, [dispatch, isLoggedIn, userId, isSetUp, notifications]);

  useEffect(() => (isApp ? listenForPushTaps(openNotifiedChat) : undefined), []);

  useEffect(() => {
    reportErrorsAs(userId);
    return () => reportErrorsAs(null);
  }, [userId]);

  useEffect(() => {
    setChatOpener((conversationId) => {
      const path = chatPath(conversationId);
      if (window.location.pathname !== path) navigate(path);
    });
  }, [navigate]);

  if (!isLoggedIn || !userId) {
    return <Navigate to={"/auth/welcome"} replace />;
  }

  // setup sends you on to where you were going, so a link opened mid-setup still lands
  if (!isSetUp) return <Navigate to={PATH_SETUP} replace state={{ from: location }} />;

  return (
    <MotionLazyContainer>
      <MotionConfig reducedMotion="user">
        <Stack direction={{ xs: "column-reverse", md: "row" }} sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
          <NavRail />
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <PageArea value={PAGE_AREA}>
              <Outlet />
            </PageArea>
          </Box>
          <EncryptionGate />
          {isApp && isEncryptionReady && <NotificationsPrompt />}
        </Stack>
      </MotionConfig>
    </MotionLazyContainer>
  );
};

export default DashboardLayout;
