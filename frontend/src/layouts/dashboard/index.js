import { useEffect } from "react";
import { Stack, useMediaQuery } from "@mui/material";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Sidebar from "@/layouts/dashboard/Sidebar";
import { GetOnlineFriends } from "@/redux/slices/actions/userActions";
import { DeliverWaitingMessages, GetConversations, OpenChatById } from "@/redux/slices/actions/chatActions";
import { PrepareEncryption } from "@/redux/slices/actions/encryptionActions";
import { ConnectSocket } from "@/redux/slices/actions/socketActions";
import { PATH_DASHBOARD } from "@/routes/paths";
import EncryptionGate from "@/sections/encryption/EncryptionGate";
import { setChatOpener } from "@/utils/notifications";

const DashboardLayout = () => {
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoggedIn } = useSelector((state) => state.auth);
  const userId = useSelector((state) => state.user.user._id);

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

  useEffect(() => {
    setChatOpener((conversationId) => {
      dispatch(OpenChatById(conversationId));
      navigate(PATH_DASHBOARD.general.chat);
    });
  }, [dispatch, navigate]);

  if (!isLoggedIn || !userId) {
    return <Navigate to={"/auth/welcome"} />;
  }

  return (
    <Stack direction={isSmallScreen ? "column-reverse" : "row"}>
      <Sidebar />
      <EncryptionGate />
    </Stack>
  );
};

export default DashboardLayout;
