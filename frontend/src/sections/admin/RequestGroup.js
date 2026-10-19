import { Box, Button, ButtonBase, Collapse, Link, Stack, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { alpha } from "@mui/material/styles";
import { ArrowUpRight, CaretDown } from "phosphor-react";
import { useDispatch } from "react-redux";
import TimeAgo from "react-timeago";

import useIsLoading from "@/hooks/useIsLoading";
import { CloseGameRequests } from "@/redux/slices/actions/adminActions";
import getAvatar from "@/utils/avatars";
import { kindOf } from "@/utils/gameRequestKinds";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const fullNameOf = (person) => (person ? `${person.firstName} ${person.lastName}`.trim() : "Whisprl user");

const addressOf = (link) => {
  try {
    const url = new URL(link);
    return `${url.hostname.replace(/^www\./, "")}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return link;
  }
};

const Highlighted = ({ text, search }) => {
  const words = search.trim().split(/\s+/).filter(Boolean).map(escapeRegex);
  if (!words.length) return text;
  return text.split(new RegExp(`(${words.join("|")})`, "gi")).map((part, position) =>
    position % 2 ? (
      <Box key={position} component="mark" sx={{ px: 0.25, borderRadius: 0.75, color: "inherit", bgcolor: (theme) => alpha(theme.palette.primary.glow, 0.3) }}>
        {part}
      </Box>
    ) : (
      part
    )
  );
};

const KindChip = ({ value }) => {
  const kind = kindOf(value);
  return (
    <Stack component="span" direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0, px: 1, py: 0.25, borderRadius: 99, fontSize: 12, fontWeight: 700, color: "text.primary", bgcolor: alpha(kind.color, 0.16) }}>
      <kind.Icon size={12} weight="fill" color={kind.color} />
      <span>{kind.label}</span>
    </Stack>
  );
};

const Askers = ({ requests }) => (
  <Stack component="span" direction="row" aria-hidden sx={{ display: { xs: "none", sm: "flex" }, "& > *:not(:first-of-type)": { ml: -1 } }}>
    {requests.slice(0, 3).map(({ _id, user }) => (
      <Box key={_id} component="span" sx={{ display: "flex", borderRadius: "50%", border: 2, borderColor: "background.default" }}>
        {getAvatar(user?.avatar, fullNameOf(user), 26)}
      </Box>
    ))}
  </Stack>
);

const DemandBar = ({ share }) => (
  <Box component="span" aria-hidden sx={{ display: "block", mt: 1.25, height: 4, borderRadius: 99, overflow: "hidden", bgcolor: (theme) => alpha(theme.palette.primary.glow, 0.12) }}>
    <Box component="span" sx={{ display: "block", width: `${Math.max(4, share * 100)}%`, height: 1, borderRadius: 99, bgcolor: "primary.glow" }} />
  </Box>
);

const RequestLink = ({ link }) => (
  <Link
    href={link}
    target="_blank"
    rel="noopener noreferrer nofollow"
    title={link}
    underline="none"
    sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, maxWidth: "100%", px: 1.25, py: 0.5, borderRadius: 2, border: 1, borderColor: "divider", fontSize: 13, fontWeight: 600, color: "text.primary", "&:hover": { borderColor: "primary.glow" } }}
  >
    <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {addressOf(link)}
    </Box>
    <ArrowUpRight size={13} weight="bold" />
  </Link>
);

const OneRequest = ({ request, groupKind }) => (
  <Box component="li" sx={{ py: 2, "& + li": { borderTop: 1, borderColor: "divider" } }}>
    <Stack direction="row" alignItems="center" spacing={1.25}>
      {getAvatar(request.user?.avatar, fullNameOf(request.user), 32)}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>
          {fullNameOf(request.user)}
        </Typography>
        <Typography noWrap sx={{ fontSize: 12.5, color: "text.secondary" }}>
          {request.user?.username && `@${request.user.username}, `}
          <TimeAgo date={request.createdAt} />
        </Typography>
      </Box>
      {request.kind !== groupKind && <KindChip value={request.kind} />}
    </Stack>
    {request.details && (
      <Typography sx={{ mt: 1.25, ml: { sm: 5.5 }, maxWidth: "68ch", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{request.details}</Typography>
    )}
    {Boolean(request.links.length) && (
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} sx={{ mt: 1.25, ml: { sm: 5.5 } }}>
        {request.links.map((link) => (
          <RequestLink key={link} link={link} />
        ))}
      </Stack>
    )}
  </Box>
);

const Decision = ({ group, status, onChanged }) => {
  const dispatch = useDispatch();
  const isClosing = useIsLoading(CloseGameRequests);

  if (status !== "open") {
    return (
      <Typography sx={{ mt: 1, fontSize: 13, color: "text.secondary" }}>
        {status === "added" ? "Marked as added" : "Dismissed"} by {fullNameOf(group.closedBy)}, <TimeAgo date={group.closedAt} />
      </Typography>
    );
  }

  const close = async (outcome) => {
    const result = await dispatch(CloseGameRequests({ key: group.key, outcome }));
    if (CloseGameRequests.fulfilled.match(result)) onChanged();
  };

  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
      <LoadingButton variant="contained" loading={isClosing} onClick={() => close("added")}>
        Mark as added
      </LoadingButton>
      <Button color="inherit" disabled={isClosing} onClick={() => close("dismissed")}>
        Dismiss
      </Button>
    </Stack>
  );
};

const RequestGroup = ({ group, mostAsked, search, status, isOpen, onToggle, onChanged }) => (
  <Box component="li" sx={{ borderBottom: 1, borderColor: "divider" }}>
    <ButtonBase
      onClick={onToggle}
      aria-expanded={isOpen}
      sx={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: { xs: "28px minmax(0, 1fr) 60px", sm: "44px minmax(0, 1fr) 156px" },
        columnGap: { xs: 1.5, sm: 2 },
        alignItems: "center",
        px: 1,
        py: 2,
        borderRadius: 2,
        textAlign: "left",
        "&:hover": { bgcolor: "action.hover" },
        "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.glow" },
      }}
    >
      <Box component="span" sx={{ fontSize: { xs: 18, sm: 24 }, fontWeight: 800, textAlign: "right", color: "text.disabled", fontVariantNumeric: "tabular-nums" }}>
        {group.rank}
      </Box>
      <Box component="span" sx={{ minWidth: 0 }}>
        <Box component="span" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 16.5, fontWeight: 800 }}>
          <Highlighted text={group.name} search={search} />
        </Box>
        <Stack component="span" direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5, minWidth: 0 }}>
          <KindChip value={group.kind} />
          <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5, color: "text.secondary" }}>
            Last asked <TimeAgo date={group.latestAt} />
          </Box>
        </Stack>
        <DemandBar share={mostAsked ? group.count / mostAsked : 0} />
      </Box>
      <Stack component="span" direction="row" alignItems="center" justifyContent="flex-end" spacing={1.5}>
        <Askers requests={group.requests} />
        <Box component="span" sx={{ textAlign: "right" }}>
          <Box component="span" sx={{ display: "block", fontSize: 20, fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
            {group.count}
          </Box>
          <Box component="span" sx={{ display: "block", fontSize: 11.5, color: "text.secondary" }}>
            asked
          </Box>
        </Box>
        <Box component="span" sx={{ display: "flex", color: "text.secondary", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }}>
          <CaretDown size={16} weight="bold" />
        </Box>
      </Stack>
    </ButtonBase>
    <Collapse in={isOpen} unmountOnExit>
      <Box sx={{ pl: { xs: 1, sm: 8 }, pr: 1, pb: 2.5 }}>
        <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
          {group.requests.map((request) => (
            <OneRequest key={request._id} request={request} groupKind={group.kind} />
          ))}
        </Box>
        <Decision group={group} status={status} onChanged={onChanged} />
      </Box>
    </Collapse>
  </Box>
);

export default RequestGroup;
