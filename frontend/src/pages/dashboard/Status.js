import { useCallback, useEffect, useState } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import useIsLoading from "@/hooks/useIsLoading";
import { PAGE_HEIGHT_WITH_TAB_BAR } from "@/layouts/dashboard/NavRail";
import { ChooseStatusMedia, GetDiscover, GetStatuses } from "@/redux/slices/actions/statusActions";
import DiscoverGrid from "@/sections/status/DiscoverGrid";
import StatusComposer from "@/sections/status/StatusComposer";
import StatusList from "@/sections/status/StatusList";
import StatusPane from "@/sections/status/StatusPane";
import StatusViewer from "@/sections/status/StatusViewer";
import YourUpdates from "@/sections/status/YourUpdates";
import { groupByOwner, isLive } from "@/utils/statuses";

const LIST_WIDTH = { md: 340, lg: 380 };

const Status = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const isWide = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const meId = useSelector((state) => state.user.user._id);
  const isEncryptionReady = useSelector((state) => state.encryption.status === "ready");
  const statuses = useSelector((state) => state.status.statuses);
  const discover = useSelector((state) => state.status.discover);
  const isFetchingStatuses = useIsLoading(GetStatuses);
  const isFetchingDiscover = useIsLoading(GetDiscover);
  const [draft, setDraft] = useState(null);
  const [shownPerson, setShownPerson] = useState(null);

  useEffect(() => {
    if (!isEncryptionReady) return;
    dispatch(GetStatuses());
    dispatch(GetDiscover());
  }, [dispatch, isEncryptionReady]);

  const groups = groupByOwner(statuses.filter((status) => isLive(status)));
  const myGroup = groups.find((group) => group.owner._id === meId);
  const friends = groups.filter((group) => group !== myGroup);
  const recent = friends.filter((group) => group.hasUnseen);
  const viewed = friends.filter((group) => !group.hasUnseen);
  const discovered = groupByOwner(discover.filter((status) => isLive(status)));

  const shown = params.get("show");
  const pane = shown === "yours" ? "yours" : "discover";
  const isPaneOpen = isWide || Boolean(shown);
  const personId = params.get("person");
  const isPlayable = [...groups, ...discovered].some((group) => group.owner._id === personId);
  // the viewer waits for the first person's updates to load, then stays until it runs out of updates itself
  const isViewerOpen = Boolean(personId) && (isPlayable || shownPerson === personId);

  const showPane = (choice) => setParams(choice === "discover" && isWide ? {} : { show: choice }, { replace: isWide });
  const play = (ownerId, statusId) => setParams({ ...(shown && { show: shown }), person: ownerId, ...(statusId && { update: statusId }) });

  // opened from inside the app, closing steps back to where it was opened; opened from outside, it only clears
  const leave = useCallback(() => (location.key === "default" ? setParams({}, { replace: true }) : navigate(-1)), [location.key, navigate, setParams]);

  useEffect(() => {
    if (isPlayable) setShownPerson(personId);
  }, [isPlayable, personId]);

  const write = () => setDraft({ kind: "text" });
  const chooseMedia = async () => {
    const chosen = await dispatch(ChooseStatusMedia());
    if (chosen) setDraft(chosen);
  };

  // your own updates play on their own, and anyone else's run on through the people listed alongside them
  const queueFor = (ownerId) => {
    if (ownerId === meId) return [meId];
    const isDiscovered = discovered.some((group) => group.owner._id === ownerId);
    return (isDiscovered ? discovered : [...recent, ...viewed]).map((group) => group.owner._id);
  };

  return (
    <Box sx={{ display: "flex", flexGrow: 1, minWidth: 0, height: { xs: PAGE_HEIGHT_WITH_TAB_BAR, md: "100dvh" }, bgcolor: "chat.list" }}>
      {(isWide || !shown) && (
        <Box sx={{ width: { xs: "100%", ...LIST_WIDTH }, flexShrink: 0, borderRight: (theme) => ({ xs: "none", md: `1px solid ${theme.palette.divider}` }) }}>
          <StatusList
            myGroup={myGroup}
            recent={recent}
            viewed={viewed}
            discoverUnseen={discovered.filter((group) => group.hasUnseen).length}
            selected={isWide ? pane : null}
            isWide={isWide}
            isLoading={!isEncryptionReady || isFetchingStatuses}
            onOpen={(ownerId) => play(ownerId)}
            onOpenMine={() => showPane("yours")}
            onOpenDiscover={() => showPane("discover")}
            onWrite={write}
            onChooseMedia={chooseMedia}
          />
        </Box>
      )}

      {isPaneOpen && (
        <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
          {pane === "yours" ? (
            <YourUpdates
              statuses={myGroup?.statuses ?? []}
              onWrite={write}
              onChooseMedia={chooseMedia}
              onPlay={(statusId) => play(meId, statusId)}
              onBack={isWide ? undefined : leave}
            />
          ) : (
            <StatusPane title="Discover" subtitle="Updates shared with everyone, from people beyond your friends" onBack={isWide ? undefined : leave}>
              <DiscoverGrid groups={discovered} isLoading={!isEncryptionReady || isFetchingDiscover} onOpen={(ownerId) => play(ownerId)} />
            </StatusPane>
          )}
        </Box>
      )}

      {isViewerOpen && <StatusViewer key={personId} ownerIds={queueFor(personId)} startOwnerId={personId} startStatusId={params.get("update")} onClose={leave} />}
      {draft && <StatusComposer draft={draft} onClose={() => setDraft(null)} />}
    </Box>
  );
};

export default Status;
