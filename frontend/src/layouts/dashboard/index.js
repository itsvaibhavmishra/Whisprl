import { useEffect } from "react";
import { Stack, useMediaQuery } from "@mui/material";
import { Navigate } from "react-router-dom";

import Sidebar from "@/layouts/dashboard/Sidebar";
import { connectSocket, socket } from "@/utils/socket";

import { useDispatch, useSelector } from "react-redux";
import { ShowSnackbar, updateOnlineUsers } from "@/redux/slices/userSlice";
import { applyReceipt, updateMemberKeys, updateTypingConvo } from "@/redux/slices/chatSlice";
import { GetOnlineFriends } from "@/redux/slices/actions/userActions";
import {
  DeliverWaitingMessages,
  GetConversations,
  ReceiveMessage,
  ReceiveMessageUpdate,
} from "@/redux/slices/actions/chatActions";
import { StartServer } from "@/redux/slices/actions/authActions";
import { PrepareEncryption } from "@/redux/slices/actions/encryptionActions";
import EncryptionGate from "@/sections/encryption/EncryptionGate";

const DashboardLayout = () => {
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));

  // from redux
  const dispatch = useDispatch();
  const { isLoggedIn } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.user);

  // get conversations and friends
  useEffect(() => {
    if (user.token) {
      // previews can only be decrypted once this browser's key is loaded
      dispatch(PrepareEncryption()).then(() => {
        dispatch(GetConversations());
        dispatch(DeliverWaitingMessages());
      });

      // get online friends
      dispatch(GetOnlineFriends());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user._id]);

  useEffect(() => {
    // start server
    dispatch(StartServer());

    // socket connection
    if ((!socket || !socket.connected) && user._id) {
      connectSocket(user.token);
    }

    // socket listeners
    if (socket) {
      // socket server error handling
      socket.on("connect_error", (error) => {
        dispatch(
          ShowSnackbar({
            severity: "error",
            message: `Socket: ${error.message}`,
          })
        );
      });

      // socket other error handling
      socket.on("error", (error) => {
        dispatch(
          ShowSnackbar({
            severity: error.status,
            message: `Socket: ${error.message}`,
          })
        );
      });

      socket.on("message_received", (message) => {
        dispatch(ReceiveMessage(message));
      });

      socket.on("message_updated", (message) => {
        dispatch(ReceiveMessageUpdate(message));
      });

      socket.on("receipts", (receipt) => {
        dispatch(applyReceipt(receipt));
      });

      socket.on("keys_changed", (keys) => {
        dispatch(updateMemberKeys(keys));
        if (keys.userId !== user._id) dispatch(DeliverWaitingMessages());
      });

      socket.on("online_friends", (friend) => {
        dispatch(updateOnlineUsers(friend));
      });

      socket.on("start_typing", (typingData) => {
        dispatch(updateTypingConvo(typingData));
      });

      socket.on("stop_typing", (typingData) => {
        dispatch(updateTypingConvo(typingData));
      });

      return () => {
        if (socket) {
          socket.off("connect_error");
          socket.off("error");
          socket.off("message_received");
          socket.off("message_updated");
          socket.off("receipts");
          socket.off("keys_changed");
          socket.off("online_friends");
          socket.off("start_typing");
          socket.off("stop_typing");
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user._id, user.token]);

  if (!isLoggedIn || !user) {
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
