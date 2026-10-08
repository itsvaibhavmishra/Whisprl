import { useState } from "react";
import { Button } from "@mui/material";
import { useDispatch } from "react-redux";

import ProfileSheet from "@/components/profile/ProfileSheet";
import useIsLoading from "@/hooks/useIsLoading";
import useRelationship from "@/hooks/useRelationship";
import { AcceptRejectRequest, CancelRequest } from "@/redux/slices/actions/contactActions";
import { waitLabel } from "@/utils/relationship";

// it sits inside clickable cards and message bubbles, so its own click stops here
const onlyHere = (action) => (event) => {
  event.stopPropagation();
  action();
};

const RequestButton = ({ person, ...button }) => {
  const dispatch = useDispatch();
  const relationship = useRelationship(person._id);
  const isCancelling = useIsLoading(CancelRequest, person._id);
  const isAnswering = useIsLoading(AcceptRejectRequest);
  const [isAsking, setIsAsking] = useState(false);

  const buttonFor = () => {
    switch (relationship.state) {
      case "none":
        return (
          <Button variant="contained" onClick={onlyHere(() => setIsAsking(true))} {...button}>
            Add friend
          </Button>
        );
      case "outgoing":
        return (
          <Button color="inherit" disabled={isCancelling} onClick={onlyHere(() => dispatch(CancelRequest(person._id)))} {...button}>
            Cancel request
          </Button>
        );
      case "incoming":
        return (
          <Button
            variant="contained"
            disabled={isAnswering}
            onClick={onlyHere(() => dispatch(AcceptRejectRequest({ sender_id: person._id, type: "accept" })))}
            {...button}
          >
            Accept
          </Button>
        );
      case "cooldown":
        return (
          <Button disabled {...button}>
            {waitLabel(relationship.until)}
          </Button>
        );
      default:
        return null;
    }
  };

  // the sheet outlives the button that opened it, which changes the moment a request goes out
  return (
    <>
      {buttonFor()}
      {isAsking && <ProfileSheet person={person} startWithComposer onClose={() => setIsAsking(false)} />}
    </>
  );
};

export default RequestButton;
