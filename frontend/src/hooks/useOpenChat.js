import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { CreateOpenConversation } from "@/redux/slices/actions/chatActions";
import { PATH_DASHBOARD } from "@/routes/paths";

const useOpenChat = (personId) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return () => {
    dispatch(CreateOpenConversation(personId));
    navigate(PATH_DASHBOARD.general.chat);
  };
};

export default useOpenChat;
