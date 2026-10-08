import { useSelector } from "react-redux";

import { relationshipWith } from "@/utils/relationship";

const useRelationship = (userId) => {
  const meId = useSelector((state) => state.user.user._id);
  const friends = useSelector((state) => state.user.friends);
  const { incoming, outgoing, cooldowns } = useSelector((state) => state.contact);
  return relationshipWith(userId, { meId, friends, incoming, outgoing, cooldowns });
};

export default useRelationship;
