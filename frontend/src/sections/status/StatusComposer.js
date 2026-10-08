import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { CaretDown, UsersThree } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import MediaEditor from "@/components/media-editor/MediaEditor";
import { GetHiddenFrom, PostStatus } from "@/redux/slices/actions/statusActions";
import { GetFriends } from "@/redux/slices/actions/userActions";
import AudienceDialog, { audienceLabelOf } from "@/sections/status/AudienceDialog";

const StatusComposer = ({ draft, onClose }) => {
  const dispatch = useDispatch();
  const hiddenFrom = useSelector((state) => state.status.hiddenFrom);
  const { friends, user } = useSelector((state) => state.user);
  const [chosenAudience, setChosenAudience] = useState(null);
  const [isChoosingAudience, setIsChoosingAudience] = useState(false);
  const media = draft.kind === "text" ? null : draft;
  // with no choice made here the server applies Settings itself, so sharing before Settings has loaded cannot skip it
  const audience = chosenAudience ?? { except: hiddenFrom };
  // friends lists include their owner, and a mention is only worth making for someone who will see the update
  const canMention = (friend) => {
    if (friend._id === user._id) return false;
    return audience.only ? audience.only.includes(friend._id) : !audience.except.includes(friend._id);
  };

  useEffect(() => {
    dispatch(GetHiddenFrom());
    dispatch(GetFriends());
  }, [dispatch]);

  const share = (edits) => {
    dispatch(PostStatus({ ...draft, edits, ...(chosenAudience && { audience: chosenAudience }) }));
    onClose();
  };

  return (
    <>
      <MediaEditor
        media={media}
        isStory
        people={friends.filter(canMention)}
        label={media ? "Share a photo or video" : "Write a status"}
        doneLabel="Share"
        onDone={share}
        onClose={onClose}
        footer={
          <Button
            onClick={() => setIsChoosingAudience(true)}
            startIcon={<UsersThree size={18} />}
            endIcon={<CaretDown size={14} />}
            aria-label={`Who can see this update: ${audienceLabelOf(audience)}`}
            sx={{ color: "#fff", borderRadius: 99, px: 1.5, bgcolor: "rgba(255, 255, 255, 0.14)", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.22)" } }}
          >
            {audienceLabelOf(audience)}
          </Button>
        }
      />
      {isChoosingAudience && <AudienceDialog audience={audience} onSave={setChosenAudience} onClose={() => setIsChoosingAudience(false)} />}
    </>
  );
};

export default StatusComposer;
