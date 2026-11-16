import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import BadgeShowcase from "@/components/badges/BadgeShowcase";
import useImageReady from "@/hooks/useImageReady";
import { ClaimBadges, GetMyBadges } from "@/redux/slices/actions/badgeActions";
import { SHOWCASE_SIZE, badgeArtAt } from "@/utils/badges";

// admin gives and takes badges without reaching an open app, so they are checked whenever the app comes to the front
const NewBadgePopup = () => {
  const dispatch = useDispatch();
  const next = useSelector((state) => state.badge.offered[0]);
  const isArtReady = useImageReady(next && badgeArtAt(next.art, SHOWCASE_SIZE));

  useEffect(() => {
    const check = () => document.visibilityState === "visible" && dispatch(GetMyBadges());
    check();
    document.addEventListener("visibilitychange", check);
    return () => document.removeEventListener("visibilitychange", check);
  }, [dispatch]);

  if (!next || !isArtReady) return null;
  // no way to close it but claiming, so a given badge always ends up on the profile
  return <BadgeShowcase key={next.id} badges={[next]} claim={() => dispatch(ClaimBadges([next.id]))} />;
};

export default NewBadgePopup;
