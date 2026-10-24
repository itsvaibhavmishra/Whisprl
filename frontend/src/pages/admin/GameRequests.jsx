import { useCallback, useEffect, useState } from "react";
import { Box, Button, ButtonBase, CircularProgress, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";

import SearchPill from "@/components/SearchPill";
import useIsLoading from "@/hooks/useIsLoading";
import { GetGameRequests } from "@/redux/slices/actions/adminActions";
import Notice from "@/sections/admin/Notice";
import PillGroup from "@/sections/admin/PillGroup";
import RequestGroup from "@/sections/admin/RequestGroup";
import { REQUEST_KINDS } from "@/utils/gameRequestKinds";

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "added", label: "Added" },
  { value: "dismissed", label: "Dismissed" },
];
const KINDS = [{ value: "all", label: "All kinds" }, ...REQUEST_KINDS];
const PAGE_SIZE = 20;
const SEARCH_PAUSE = 300;

const EMPTY = {
  open: { title: "No requests yet", body: "When someone asks for a game from the games list, it arrives here, ranked by how many people asked." },
  added: { title: "Nothing added yet", body: "Games you mark as added are listed here." },
  dismissed: { title: "Nothing dismissed yet", body: "Requests you decide not to take up are listed here." },
};

const KindFilter = ({ value, onChange }) => (
  <Stack role="group" aria-label="Kind" direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap" }}>
    {KINDS.map((option) => {
      const isCurrent = option.value === value;
      return (
        <ButtonBase
          key={option.value}
          aria-pressed={isCurrent}
          onClick={() => onChange(option.value)}
          sx={{
            gap: 0.75,
            px: 1.5,
            height: 32,
            borderRadius: 99,
            border: 1,
            fontSize: 13,
            fontWeight: 700,
            borderColor: isCurrent ? (option.color ?? "primary.main") : "divider",
            color: isCurrent ? "text.primary" : "text.secondary",
            bgcolor: (theme) => (isCurrent ? alpha(option.color ?? theme.palette.primary.main, 0.16) : "transparent"),
            "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.main" },
          }}
        >
          {option.color && <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: option.color }} />}
          {option.label}
        </ButtonBase>
      );
    })}
  </Stack>
);

const GameRequests = () => {
  const dispatch = useDispatch();
  const { list, total, hasMore, mostAsked } = useSelector((state) => state.admin.gameRequests);
  const isLoading = useIsLoading(GetGameRequests);
  const [status, setStatus] = useState("open");
  const [kind, setKind] = useState("all");
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState(null);
  const [hasFailed, setHasFailed] = useState(false);

  const read = useCallback(
    (page) => dispatch(GetGameRequests({ status, kind, search, page })).then((result) => setHasFailed(GetGameRequests.rejected.match(result))),
    [dispatch, status, kind, search]
  );

  // a search runs once typing pauses, rather than on every letter
  useEffect(() => {
    const timer = setTimeout(() => read(), SEARCH_PAUSE);
    return () => clearTimeout(timer);
  }, [read]);

  const body = () => {
    if (!list && hasFailed) {
      return (
        <Box>
          <Notice title="The requests didn't load">Check your connection and try again.</Notice>
          <Button variant="contained" loading={isLoading} onClick={() => read()} sx={{ mt: 2 }}>
            Try again
          </Button>
        </Box>
      );
    }
    if (!list) return <CircularProgress size={28} aria-label="Loading the requests" sx={{ mt: 5 }} />;
    if (!list.length && search.trim())
      return <Notice title={`Nothing matches "${search.trim()}"`}>Try fewer words, or look under another status or kind.</Notice>;
    if (!list.length) return <Notice title={EMPTY[status].title}>{EMPTY[status].body}</Notice>;

    return (
      <>
        <Typography sx={{ mt: 3, fontSize: 13, fontWeight: 600, color: "text.secondary" }}>
          {total === 1 ? "1 game" : `${total.toLocaleString()} games`}
        </Typography>
        <Box
          component="ol"
          sx={{ m: 0, mt: 1, p: 0, listStyle: "none", borderTop: 1, borderColor: "divider", opacity: isLoading ? 0.5 : 1, transition: "opacity 160ms ease" }}
        >
          {list.map((group) => (
            <RequestGroup
              key={group.key}
              group={group}
              mostAsked={mostAsked}
              search={search}
              status={status}
              isOpen={openKey === group.key}
              onToggle={() => setOpenKey(openKey === group.key ? null : group.key)}
              onChanged={() => read()}
            />
          ))}
        </Box>
        {hasMore && (
          <Button
            variant="outlined"
            color="inherit"
            loading={isLoading}
            onClick={() => read(Math.ceil(list.length / PAGE_SIZE))}
            sx={{ mt: 2, alignSelf: "flex-start" }}
          >
            Show more
          </Button>
        )}
      </>
    );
  };

  return (
    <Stack sx={{ maxWidth: 860, px: { xs: 2, md: 6 }, py: { xs: 3, md: 6 } }}>
      <Typography component="h1" sx={{ m: 0, fontSize: { xs: 26, md: 32 }, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Game requests
      </Typography>
      <Typography sx={{ mt: 1, maxWidth: 600, fontSize: 15, color: "text.secondary", textWrap: "balance" }}>
        What people want to play next, ranked by how many asked. Requests for the same game are counted together, however each person spelled it.
      </Typography>

      <SearchPill value={search} onChange={setSearch} label="Search names, details or people" sx={{ mt: 4, maxWidth: { md: 440 } }} />
      <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", alignItems: { md: "center" }, mt: 2, gap: 1.5 }}>
        <PillGroup label="Show" options={STATUSES} value={status} onChange={setStatus} />
        <KindFilter value={kind} onChange={setKind} />
      </Stack>

      {body()}
    </Stack>
  );
};

export default GameRequests;
