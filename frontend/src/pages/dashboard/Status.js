import { useCallback, useEffect, useState } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { PAGE_HEIGHT_WITH_TAB_BAR } from "@/layouts/dashboard/NavRail";
import { ChooseStatusMedia, GetStatuses } from "@/redux/slices/actions/statusActions";
import StatusComposer from "@/sections/status/StatusComposer";
import StatusHome from "@/sections/status/StatusHome";
import StatusList from "@/sections/status/StatusList";
import StatusViewer from "@/sections/status/StatusViewer";
import { groupByOwner, isLive } from "@/utils/statuses";

const LIST_WIDTH = 360;

const Status = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const isWide = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const meId = useSelector((state) => state.user.user._id);
  const isEncryptionReady = useSelector((state) => state.encryption.status === "ready");
  const statuses = useSelector((state) => state.status.statuses);
  const [draft, setDraft] = useState(null);
  const [shownPerson, setShownPerson] = useState(null);

  useEffect(() => {
    if (isEncryptionReady) dispatch(GetStatuses());
  }, [dispatch, isEncryptionReady]);

  const groups = groupByOwner(statuses.filter((status) => isLive(status)));
  const myGroup = groups.find((group) => group.owner._id === meId);
  const friends = groups.filter((group) => group !== myGroup);
  const recent = friends.filter((group) => group.hasUnseen);
  const viewed = friends.filter((group) => !group.hasUnseen);

  const personId = params.get("person");
  const isPlayable = groups.some((group) => group.owner._id === personId);
  const isHomeAsked = params.get("show") === "yours";
  // the viewer waits for the first person's updates to load, then stays until it runs out of updates itself
  const isViewerOpen = Boolean(personId) && (isPlayable || shownPerson === personId);

  const play = (ownerId, statusId) => setParams(statusId ? { person: ownerId, update: statusId } : { person: ownerId });

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

  // your own updates play on their own; a friend's run on through everyone listed after them
  const queueFor = (ownerId) => (ownerId === meId ? [meId] : [...recent, ...viewed].map((group) => group.owner._id));

  return (
    <Box sx={{ display: "flex", flexGrow: 1, minWidth: 0, height: { xs: PAGE_HEIGHT_WITH_TAB_BAR, md: "100dvh" }, bgcolor: "background.default" }}>
      {(isWide || !isHomeAsked) && (
        <Box sx={{ width: { xs: "100%", md: LIST_WIDTH }, flexShrink: 0, borderRight: 1, borderColor: "divider" }}>
          <StatusList
            myGroup={myGroup}
            recent={recent}
            viewed={viewed}
            onOpen={(ownerId) => play(ownerId)}
            onOpenMine={isWide ? () => play(meId) : () => setParams({ show: "yours" })}
            onWrite={write}
            onChooseMedia={chooseMedia}
          />
        </Box>
      )}

      {(isWide || isHomeAsked) && (
        <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
          <StatusHome
            statuses={myGroup?.statuses ?? []}
            onWrite={write}
            onChooseMedia={chooseMedia}
            onPlay={(statusId) => play(meId, statusId)}
            onBack={isWide ? undefined : leave}
          />
        </Box>
      )}

      {isViewerOpen && <StatusViewer key={personId} ownerIds={queueFor(personId)} startOwnerId={personId} startStatusId={params.get("update")} onClose={leave} />}
      {draft && <StatusComposer draft={draft} onClose={() => setDraft(null)} />}
    </Box>
  );
};

export default Status;
