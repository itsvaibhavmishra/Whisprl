import { useEffect, useState } from "react";
import { Box, Modal } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { FinishTour } from "@/redux/slices/actions/userActions";
import { chatPath } from "@/sections/chat/chatRoute";
import useChallenge from "@/sections/chat/conversation/useChallenge";
import { cardPlacement } from "@/sections/tour/placement";
import { FIRST_GAME, TOUR_STEPS, WHISPRL_CHAT } from "@/sections/tour/steps";
import TourCard from "@/sections/tour/TourCard";
import useTargetRect from "@/sections/tour/useTargetRect";
import useTourVoice from "@/sections/tour/useTourVoice";
import { peerOf } from "@/utils/chats";
import { isOfficial } from "@/utils/relationship";

const RING = 6;
const DIM = alpha("#000", 0.62);

const useViewport = () => {
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const measure = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  return viewport;
};

// the ring stays on screen even round a tab at its very edge
const ringAround = (rect, viewport) => {
  const top = Math.max(rect.top - RING, 2);
  const left = Math.max(rect.left - RING, 2);
  return { top, left, width: Math.min(rect.right + RING, viewport.width - 2) - left, height: Math.min(rect.bottom + RING, viewport.height - 2) - top };
};

// everything but the part being shown is dimmed, and nothing behind can be tapped until the tour ends
const Spotlight = ({ rect, viewport }) =>
  rect ? (
    <Box
      sx={{
        position: "fixed",
        ...ringAround(rect, viewport),
        borderRadius: 3,
        boxShadow: `0 0 0 9999px ${DIM}`,
        outline: 2,
        outlineColor: "primary.main",
        transition: "all 300ms ease",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      }}
    />
  ) : (
    <Box sx={{ position: "fixed", inset: 0, bgcolor: DIM }} />
  );

const Tour = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const meId = useSelector((state) => state.user.user._id);
  const whisprlChat = useSelector((state) => state.chat.conversations.find((chat) => !chat.isGroup && isOfficial(peerOf(chat, meId))));
  const { challenge } = useChallenge(whisprlChat);
  const [position, setPosition] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const viewport = useViewport();

  // someone without a chat with Whisprl yet ends the tour at their chats
  const steps = whisprlChat ? TOUR_STEPS : TOUR_STEPS.filter((step) => step.page !== WHISPRL_CHAT);
  const step = steps[position];
  const page = step.page === WHISPRL_CHAT ? chatPath(whisprlChat._id) : step.page;
  const rect = useTargetRect(step.target);
  const voice = useTourVoice(step.id, isMuted);

  // only on moving to a step, so a page that opens on one of its own panes, as Contacts does on a computer, is left there
  useEffect(() => {
    if (page) navigate(page);
  }, [page, navigate]);

  const finish = () => dispatch(FinishTour());
  const move = (change) => setPosition((current) => Math.min(Math.max(current + change, 0), steps.length - 1));
  const play = () => {
    challenge(FIRST_GAME);
    finish();
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowRight" && position < steps.length - 1) move(1);
    if (event.key === "ArrowLeft") move(-1);
  };

  return (
    <Modal open onClose={finish} hideBackdrop>
      <Box onKeyDown={onKeyDown} sx={{ position: "fixed", inset: 0, outline: "none" }}>
        <Spotlight rect={rect} viewport={viewport} />
        <TourCard
          step={step}
          position={position}
          count={steps.length}
          placement={cardPlacement(rect, viewport)}
          voice={voice}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted((muted) => !muted)}
          onBack={() => move(-1)}
          onNext={() => move(1)}
          onSkip={finish}
          onPlay={play}
        />
      </Box>
    </Modal>
  );
};

export default Tour;
