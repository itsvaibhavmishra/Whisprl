import { Box, Collapse, Stack, Typography } from "@mui/material";
import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react";
import { useWatch } from "react-hook-form";

import { PASSWORD_RULES } from "@/utils/formRules";
import { SPOKEN_ONLY } from "@/utils/spokenOnly";

// it appears with the first character typed and folds away once nothing is missing, so an empty form stays short
const PasswordChecklist = ({ name }) => {
  const password = useWatch({ name }) || "";
  const isNeeded = Boolean(password) && !PASSWORD_RULES.every(({ isMet }) => isMet(password));

  return (
    <Collapse in={isNeeded} unmountOnExit>
      <Box
        component="ul"
        aria-label="Password requirements"
        sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: { sm: "repeat(2, 1fr)" }, rowGap: 0.75, columnGap: 2 }}
      >
        {PASSWORD_RULES.map(({ label, isMet }) => {
          const met = isMet(password);
          return (
            <Stack component="li" key={label} direction="row" spacing={1} sx={{ alignItems: "center", color: met ? "success.main" : "text.secondary" }}>
              {met ? <CheckCircleIcon size={16} weight="fill" aria-hidden="true" /> : <CircleIcon size={16} aria-hidden="true" />}
              <Typography variant="body2" component="span" sx={{ fontWeight: 400 }}>
                {label}
                <Box component="span" sx={SPOKEN_ONLY}>
                  {met ? ", done" : ", not yet"}
                </Box>
              </Typography>
            </Stack>
          );
        })}
      </Box>
    </Collapse>
  );
};

export default PasswordChecklist;
