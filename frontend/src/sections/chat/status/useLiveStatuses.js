import { useEffect, useReducer } from "react";
import { createSelector } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";

import { isLive } from "@/utils/statuses";

const NONE = [];

// grouped once per change to the statuses, so each avatar on screen picks its own out without scanning them all
const selectStatusesByOwner = createSelector([(state) => state.status.statuses], (statuses) => {
  const byOwner = {};
  statuses.forEach((status) => {
    const owned = byOwner[status.owner._id] ?? [];
    owned.push(status);
    byOwner[status.owner._id] = owned;
  });
  return byOwner;
});

const useLiveStatuses = (ownerId) => {
  const statuses = useSelector((state) => selectStatusesByOwner(state)[ownerId] ?? NONE);
  const isBlocked = useSelector((state) => (state.user.user.blocked ?? NONE).includes(ownerId));
  const [, redraw] = useReducer((count) => count + 1, 0);
  const live = statuses.filter((status) => isLive(status));
  const nextExpiry = Math.min(...live.map((status) => new Date(status.expiresAt).getTime()));

  // nothing in the store changes when a status expires, so a timer redraws at the soonest expiry
  useEffect(() => {
    if (!Number.isFinite(nextExpiry)) return undefined;
    const timer = setTimeout(redraw, Math.max(nextExpiry - Date.now(), 0) + 50);
    return () => clearTimeout(timer);
  }, [nextExpiry]);

  return isBlocked ? NONE : live;
};

export default useLiveStatuses;
