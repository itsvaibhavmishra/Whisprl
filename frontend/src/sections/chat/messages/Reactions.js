import { ButtonBase, Stack, Tooltip, Typography } from "@mui/material";

import { firstNameIn, listOf } from "@/utils/groups";
import { tallyReactions } from "@/utils/reactions";

const Reactions = ({ message, conversation, meId, isMine, onReact }) => {
  const tally = tallyReactions(message.reactions);
  if (!tally.length) return null;

  return (
    <Stack
      direction="row"
      sx={{ position: "absolute", bottom: -12, [isMine ? "right" : "left"]: 10, gap: 0.5, zIndex: 1 }}
    >
      {tally.map(({ emoji, users }) => {
        const hasMine = users.includes(meId);
        const names = listOf(users.map((userId) => firstNameIn(conversation, userId, meId)));
        return (
          <Tooltip key={emoji} title={names}>
            <ButtonBase
              onClick={() => onReact(emoji)}
              aria-pressed={hasMine}
              aria-label={`${emoji} from ${names}`}
              sx={{
                gap: 0.5,
                px: 0.75,
                py: 0,
                borderRadius: 99,
                fontSize: 14,
                lineHeight: 1.4,
                bgcolor: "background.default",
                border: 2,
                borderColor: hasMine ? "primary.main" : "background.paper",
              }}
            >
              <span aria-hidden>{emoji}</span>
              {users.length > 1 && (
                <Typography component="span" variant="caption" sx={{ fontWeight: 700 }}>
                  {users.length}
                </Typography>
              )}
            </ButtonBase>
          </Tooltip>
        );
      })}
    </Stack>
  );
};

export default Reactions;
