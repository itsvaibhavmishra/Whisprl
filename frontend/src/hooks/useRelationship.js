import { useSelector } from "react-redux";

import { relationshipWith } from "@/utils/relationship";

const NONE = [];

const useRelationship = (userId) => {
  const { _id: meId, blocked = NONE } = useSelector((state) => state.user.user);
  const friends = useSelector((state) => state.user.friends);
  const { incoming, outgoing, cooldowns } = useSelector((state) => state.contact);
  return relationshipWith(userId, { meId, blocked, friends, incoming, outgoing, cooldowns });
};

export default useRelationship;
