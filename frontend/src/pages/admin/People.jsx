import { useCallback, useEffect, useState } from "react";
import { Box, Button, CircularProgress, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { GetPeople } from "@/redux/slices/actions/adminActions";
import Notice from "@/sections/admin/Notice";
import PersonRow from "@/sections/admin/PersonRow";
import PillGroup from "@/sections/admin/PillGroup";

const FILTERS = [
  { value: "all", label: "Everyone" },
  { value: "banned", label: "Banned" },
  { value: "suspended", label: "Suspended" },
  { value: "staff", label: "Admins" },
];

const SEARCH_PAUSE = 300;

const People = () => {
  const dispatch = useDispatch();
  const { list, total, hasMore } = useSelector((state) => state.admin.people);
  const isLoading = useIsLoading(GetPeople);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [hasFailed, setHasFailed] = useState(false);

  const read = useCallback(
    (page) => dispatch(GetPeople({ search, filter, page })).then((result) => setHasFailed(GetPeople.rejected.match(result))),
    [dispatch, search, filter]
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
          <Notice title="The list didn't load">Check your connection and try again.</Notice>
          <Button variant="contained" loading={isLoading} onClick={() => read()} sx={{ mt: 2 }}>
            Try again
          </Button>
        </Box>
      );
    }
    if (!list) return <CircularProgress size={28} aria-label="Loading the people" sx={{ mt: 5 }} />;
    if (!list.length) return <Notice title="Nobody matches">Try another name, username or email, or a different filter.</Notice>;

    return (
      <>
        <Typography sx={{ mt: 3, fontSize: 13, fontWeight: 600, color: "text.secondary" }}>
          {total === 1 ? "1 person" : `${total.toLocaleString()} people`}
        </Typography>
        <Box component="ul" sx={{ m: 0, mt: 1, p: 0, listStyle: "none", opacity: isLoading ? 0.5 : 1, transition: "opacity 160ms ease" }}>
          {list.map((person) => (
            <PersonRow key={person._id} person={person} onChanged={() => read()} />
          ))}
        </Box>
        {hasMore && (
          <Button variant="outlined" color="inherit" loading={isLoading} onClick={() => read(Math.ceil(list.length / 30))} sx={{ mt: 2 }}>
            Show more
          </Button>
        )}
      </>
    );
  };

  return (
    <Stack sx={{ maxWidth: 900, px: { xs: 2, md: 6 }, py: { xs: 3, md: 6 } }}>
      <Typography component="h1" sx={{ m: 0, fontSize: { xs: 26, md: 32 }, fontWeight: 800, letterSpacing: "-0.02em" }}>
        People
      </Typography>
      <Typography sx={{ mt: 1, maxWidth: 560, fontSize: 15, color: "text.secondary", textWrap: "balance" }}>
        Everyone with an account. Suspending or banning closes their sessions at once, and always asks why.
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} sx={{ alignItems: { md: "center" }, mt: 4, gap: 1.5 }}>
        <TextField
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Name, username or email"
          sx={{ flex: 1, maxWidth: { md: 320 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <MagnifyingGlassIcon size={18} />
                </InputAdornment>
              ),
            },
            htmlInput: { "aria-label": "Search people" },
          }}
        />
        <PillGroup label="Show" options={FILTERS} value={filter} onChange={setFilter} />
      </Stack>

      {body()}
    </Stack>
  );
};

export default People;
