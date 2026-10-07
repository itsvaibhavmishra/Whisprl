import { Avatar, AvatarGroup, Box, Link, Skeleton, Stack, Typography } from "@mui/material";
import { GithubLogo, GoogleLogo, LinkedinLogo } from "phosphor-react";
import { useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";

import { PATH_DASHBOARD } from "@/routes/paths";
import { avatarLookOf } from "@/utils/avatars";

const SIGN_IN_METHODS = {
  google: { label: "Google", Icon: GoogleLogo },
  github: { label: "GitHub", Icon: GithubLogo },
  linkedin: { label: "LinkedIn", Icon: LinkedinLogo },
};

const joinedOn = (date) => new Date(date).toLocaleDateString(undefined, { month: "long", year: "numeric" });

const plural = (count, noun) => `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;

const Fact = ({ label, children }) => (
  <Box sx={{ py: 2, borderBottom: 1, borderColor: "divider" }}>
    <Typography component="dt" variant="body2" sx={{ color: "text.secondary" }}>
      {label}
    </Typography>
    <Box component="dd" sx={{ m: 0, mt: 0.75, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
      {children}
    </Box>
  </Box>
);

const AccountSummary = () => {
  const summary = useSelector((state) => state.user.accountSummary);

  if (!summary) {
    return <Skeleton variant="rounded" height={320} aria-label="Loading your account details" />;
  }

  const { createdAt, friendCount, friendPreviews, conversationCount, messageCount, socialsConnected } = summary;

  return (
    <Box component="dl" sx={{ m: 0, borderTop: 1, borderColor: "divider" }}>
      <Fact label="On Whisprl since">{joinedOn(createdAt)}</Fact>
      <Fact label="Friends">
        {friendCount ? (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AvatarGroup max={5} total={friendCount} sx={{ "& .MuiAvatar-root": { width: 32, height: 32, fontSize: 14, borderColor: "background.default" } }}>
              {friendPreviews.map(({ _id, firstName, avatar }) => (
                <Avatar
                  key={_id}
                  src={avatar || undefined}
                  alt={firstName}
                  sx={{ background: avatarLookOf(firstName).background, color: "common.white" }}
                >
                  {avatarLookOf(firstName).initial}
                </Avatar>
              ))}
            </AvatarGroup>
            <Link component={RouterLink} to={PATH_DASHBOARD.general.contact} underline="hover" color="inherit">
              {plural(friendCount, "friend")}
            </Link>
          </Stack>
        ) : (
          <Link component={RouterLink} to={PATH_DASHBOARD.general.contact} underline="hover">
            Find people to chat with
          </Link>
        )}
      </Fact>
      <Fact label="Conversations">{conversationCount.toLocaleString()}</Fact>
      <Fact label="Messages sent">{messageCount.toLocaleString()}</Fact>
      <Fact label="Connected sign-ins">
        {socialsConnected.length ? (
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {socialsConnected.map((method) => {
              const { label, Icon } = SIGN_IN_METHODS[method];
              return (
                <Stack key={method} direction="row" spacing={0.75} alignItems="center">
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                </Stack>
              );
            })}
          </Stack>
        ) : (
          "Email and password only"
        )}
      </Fact>
    </Box>
  );
};

export default AccountSummary;
