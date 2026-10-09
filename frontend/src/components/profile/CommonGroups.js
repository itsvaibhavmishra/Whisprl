import { Box, ButtonBase, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import ChatAvatar from "@/sections/chat/ChatAvatar";
import { DetailsSection } from "@/sections/chat/details/DetailsSection";
import { chatPath } from "@/sections/chat/chatRoute";

const CommonGroups = ({ personId }) => {
  const navigate = useNavigate();
  const groups = useSelector((state) => state.chat.commonGroups[personId]);

  if (!groups?.length) return null;

  return (
    <DetailsSection title={`${groups.length} group${groups.length === 1 ? "" : "s"} in common`}>
      {groups.map((group) => (
        <ButtonBase
          key={group._id}
          onClick={() => navigate(chatPath(group._id))}
          sx={{ width: "100%", gap: 1.5, px: 1.5, py: 1, borderRadius: 3, justifyContent: "flex-start", textAlign: "left", "&:hover": { bgcolor: "action.hover" } }}
        >
          <ChatAvatar src={group.picture} name={group.name} size={40} />
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>
              {group.name}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>{group.memberCount} members</Typography>
          </Box>
        </ButtonBase>
      ))}
    </DetailsSection>
  );
};

export default CommonGroups;
