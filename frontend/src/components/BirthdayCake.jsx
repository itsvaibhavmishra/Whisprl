import { Box } from "@mui/material";
import { useSelector } from "react-redux";

import { isBirthdayToday } from "@/utils/birthdays";

// only friends' birthdays reach the browser, so the friends list answers for any row that names one
const BirthdayCake = ({ personId }) => {
  const isToday = useSelector((state) => isBirthdayToday(state.user.friends.find((friend) => friend._id === personId)?.birthday));
  if (!isToday) return null;

  return (
    <Box component="span" role="img" aria-label="birthday today" sx={{ ml: 0.5 }}>
      🎂
    </Box>
  );
};

export default BirthdayCake;
