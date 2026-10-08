import { useEffect } from "react";
import { Box, Stack } from "@mui/material";
import { MotionConfig } from "framer-motion";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector, useStore } from "react-redux";

import { MotionLazyContainer } from "@/components/animate";
import NavRail from "@/layouts/dashboard/NavRail";
import { GetOnlineFriends } from "@/redux/slices/actions/userActions";
import { DeliverWaitingMessages, GetConversations } from "@/redux/slices/actions/chatActions";
import { PrepareEncryption } from "@/redux/slices/actions/encryptionActions";
import { ConnectSocket } from "@/redux/slices/actions/socketActions";
import { GetDiscover, GetStatuses } from "@/redux/slices/actions/statusActions";
import { selectIsLoading } from "@/redux/slices/requestSlice";
import { chatPath } from "@/sections/chat/chatRoute";
import EncryptionGate from "@/sections/encryption/EncryptionGate";
import { setChatOpener } from "@/utils/notifications";

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoggedIn } = useSelector((state) => state.auth);
  const userId = useSelector((state) => state.user.user._id);
  const isEncryptionReady = useSelector((state) => state.encryption.status === "ready");
  const store = useStore();

  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    dispatch(ConnectSocket());
    // previews can only be decrypted once this browser's key is loaded
    dispatch(PrepareEncryption()).then(() => {
      dispatch(GetConversations());
      dispatch(DeliverWaitingMessages());
    });
    dispatch(GetOnlineFriends());
  }, [dispatch, isLoggedIn, userId]);

  // read from the store as it is now: a login may still be checking its keys, or the Status page may already be loading them
  useEffect(() => {
    const state = store.getState();
    if (state.encryption.status !== "ready") return;
    if (!selectIsLoading(state, GetStatuses)) dispatch(GetStatuses());
    if (!selectIsLoading(state, GetDiscover)) dispatch(GetDiscover());
  }, [dispatch, store, isEncryptionReady]);

  useEffect(() => {
    setChatOpener((conversationId) => {
      const path = chatPath(conversationId);
      if (window.location.pathname !== path) navigate(path);
    });
  }, [navigate]);

  if (!isLoggedIn || !userId) {
    return <Navigate to={"/auth/welcome"} />;
  }

  return (
    <MotionLazyContainer>
      <MotionConfig reducedMotion="user">
        <Stack direction={{ xs: "column-reverse", md: "row" }} sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
          <NavRail />
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <Outlet />
          </Box>
          <EncryptionGate />
        </Stack>
      </MotionConfig>
    </MotionLazyContainer>
  );
};

export default DashboardLayout;
