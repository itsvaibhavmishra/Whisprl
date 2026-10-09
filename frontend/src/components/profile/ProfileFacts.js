import { Avatar, AvatarGroup, Box, Skeleton, Stack, Typography } from "@mui/material";

import { DetailsSection } from "@/sections/chat/details/DetailsSection";
import { avatarLookOf } from "@/utils/avatars";
import { birthdayLabel, isBirthdayToday } from "@/utils/birthdays";

const joinedOn = (date) => new Date(date).toLocaleDateString(undefined, { month: "long", year: "numeric" });

const namesOf = ({ count, people }) => {
  const names = people.map((person) => person.firstName);
  const others = count - names.length;
  if (others > 0) return `${names.join(", ")} and ${others} more`;
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
};

const Fact = ({ label, children }) => (
  <Box sx={{ px: 1.5, py: 1.25 }}>
    <Typography component="dt" sx={{ fontSize: 12.5, fontWeight: 600, color: "text.secondary" }}>
      {label}
    </Typography>
    <Box component="dd" sx={{ m: 0, mt: 0.5, fontSize: 14, fontWeight: 700 }}>
      {children}
    </Box>
  </Box>
);

const ProfileFacts = ({ person }) => {
  const { createdAt, birthday, mutualFriends } = person;

  // the section holds its place until the full profile arrives, so nothing below it moves when it does
  return (
    <DetailsSection title="About">
      <Box component="dl" sx={{ m: 0 }}>
        <Fact label="On Whisprl since">{createdAt ? joinedOn(createdAt) : <Skeleton width={120} sx={{ borderRadius: 1 }} />}</Fact>
        {birthday && <Fact label="Birthday">{isBirthdayToday(birthday) ? "Today 🎂" : birthdayLabel(birthday)}</Fact>}
        {mutualFriends?.count > 0 && (
          <Fact label="Mutual friends">
            <Stack direction="row" spacing={1.25} alignItems="center">
              <AvatarGroup sx={{ "& .MuiAvatar-root": { width: 28, height: 28, fontSize: 13, borderColor: "background.paper" } }}>
                {mutualFriends.people.map(({ _id, firstName, avatar }) => (
                  <Avatar key={_id} src={avatar || undefined} alt="" sx={{ background: avatarLookOf(firstName).background, color: "common.white" }}>
                    {avatarLookOf(firstName).initial}
                  </Avatar>
                ))}
              </AvatarGroup>
              <span>{namesOf(mutualFriends)}</span>
            </Stack>
          </Fact>
        )}
      </Box>
    </DetailsSection>
  );
};

export default ProfileFacts;
